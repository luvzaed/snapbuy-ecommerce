"""Request/index concurrency checks; never download CLIP weights or access a DB."""
import importlib.util
import os
from pathlib import Path
import sys
import threading
import unittest
from unittest.mock import MagicMock, patch

import numpy as np
from fastapi.testclient import TestClient


class VisualSearchTests(unittest.TestCase):
    def setUp(self):
        self.indexer = MagicMock()
        self.indexer.load_index.return_value = {}
        torch = MagicMock()
        torch.cuda.is_available.return_value = False
        clip = MagicMock()
        clip.create_model_and_transforms.return_value = (MagicMock(), None, MagicMock())
        spec = importlib.util.spec_from_file_location('snapbuy_visual_test', Path(__file__).with_name('main.py'))
        self.server = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, {'torch': torch, 'open_clip': clip, 'indexer': self.indexer}):
            spec.loader.exec_module(self.server)
        self.client = TestClient(self.server.app)

    def test_health_search_validation_and_reindex_authentication(self):
        self.assertEqual(self.client.get('/health').json()['products_indexed'], 0)
        self.assertEqual(self.client.post('/search', json={}).status_code, 422)
        self.assertEqual(self.client.post('/search', json={'image': 'invalid'}).status_code, 503)
        with patch.dict(os.environ, {'VISUAL_SEARCH_REINDEX_TOKEN': 'test-only'}):
            self.assertEqual(self.client.post('/reindex').status_code, 403)
            self.assertEqual(self.client.post('/reindex', headers={'x-reindex-token': 'wrong'}).status_code, 403)
        self.indexer.build_index.assert_not_called()

    def test_concurrent_rebuilds_keep_latest_database_state_in_memory_and_on_disk(self):
        entered = threading.Event()
        release = threading.Event()
        attempted = threading.Event()
        newer_built = threading.Event()
        current_db = {1: {'embedding': np.array([1.0, 0.0])}}
        saved = []
        builds = []
        errors = []

        def build(*args, **kwargs):
            snapshot = dict(current_db)
            builds.append(snapshot)
            if len(builds) == 1:
                entered.set()
                if not release.wait(5):
                    raise TimeoutError('test rebuild was not released')
            else:
                newer_built.set()
            return snapshot, dict(total_in_db=len(snapshot), indexed=len(snapshot), added=0, reused=0, removed=0, failed=[])

        def run(second=False):
            try:
                if second:
                    attempted.set()
                self.server.reindex('test-only')
            except Exception as error:
                errors.append(error)

        self.indexer.build_index.side_effect = build
        self.indexer.save_index.side_effect = lambda embeddings: saved.append(dict(embeddings))
        first = threading.Thread(target=run)
        second = threading.Thread(target=run, args=(True,))
        with patch.dict(os.environ, {'VISUAL_SEARCH_REINDEX_TOKEN': 'test-only'}):
            first.start()
            try:
                self.assertTrue(entered.wait(5))
                current_db[2] = {'embedding': np.array([0.0, 1.0])}
                second.start()
                self.assertTrue(attempted.wait(5))
                self.assertFalse(newer_built.wait(0.2), 'A later snapshot must wait until the earlier rebuild is saved')
            finally:
                release.set()
                first.join(5)
                if second.ident is not None:
                    second.join(5)
        self.assertFalse(first.is_alive() or second.is_alive())
        self.assertEqual(errors, [])
        self.assertEqual([sorted(snapshot) for snapshot in saved], [[1], [1, 2]])
        self.assertEqual(sorted(self.server.product_embeddings), [1, 2])

    def test_internal_rebuild_errors_do_not_expose_connection_details(self):
        self.indexer.build_index.side_effect = RuntimeError('postgresql://private-password@localhost/db')
        with patch.dict(os.environ, {'VISUAL_SEARCH_REINDEX_TOKEN': 'test-only'}):
            response = self.client.post('/reindex', headers={'x-reindex-token': 'test-only'})
        self.assertEqual(response.status_code, 500)
        self.assertNotIn('private-password', response.text)


if __name__ == '__main__':
    unittest.main()
