"""
AI Visual Search Server - FastAPI + CLIP

Endpoints:
    GET  /health   -> Health check (reports how many products are indexed)
    POST /search   -> Upload image, get matching products
    POST /reindex  -> Rebuild the embedding index from the current database state

Usage:
    cd visual-search-server
    python main.py

Indexing model
--------------
The index maps product_id -> CLIP image embedding. It is built from the same
Postgres/Supabase database the Next.js app uses (so names/categories stay in
sync) and supports images stored either as remote URLs or as local uploads in
the Next.js public/ folder. See indexer.py for details.

The index is loaded from embeddings/products.pkl at startup and can be rebuilt
at runtime via POST /reindex (which the admin product API calls automatically
on create/edit/delete), so newly added products become searchable without a
manual script run or server restart.
"""

import sys
import io
import base64
import threading

import torch
import open_clip
import numpy as np
from io import BytesIO
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import indexer

# Fix Windows console encoding for Unicode
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# -- Config -------------------------------------------------------------------
TOP_K = 3  # Number of results to return (change this to show more/fewer)

# Minimum cosine similarity (0.0–1.0) a product must reach to appear in results.
# CLIP cosine scores are in this range; we display them as percentages (×100).
#
#   Raise (e.g. 0.65): stricter — only near-identical products show up.
#   Lower (e.g. 0.45): looser — more results but more irrelevant ones.
#   0.55 (55%) is a good starting point: catches the same model/colour, filters
#   out unrelated categories (e.g. a speaker when you uploaded a phone).
SIMILARITY_THRESHOLD = 0.55

# -- Load CLIP Model ----------------------------------------------------------
print("[*] Loading CLIP model...")
device = "cuda" if torch.cuda.is_available() else "cpu"
model, _, preprocess = open_clip.create_model_and_transforms(
    'ViT-B-32', pretrained='laion2b_s34b_b79k', device=device
)
model.eval()
print(f"[OK] Model loaded on {device}")

# -- In-memory index state ----------------------------------------------------
# These three globals are rebound together (under _index_lock) whenever the
# index changes, so readers in /search see a consistent snapshot.
product_embeddings: dict = {}
product_ids: list = []
embedding_matrix: np.ndarray = np.array([])
_index_lock = threading.Lock()


def _rebuild_matrix(embeddings: dict):
    """Turn an embeddings dict into a (product_ids, stacked_matrix) pair."""
    ids = []
    rows = []
    for pid, data in embeddings.items():
        ids.append(pid)
        rows.append(data['embedding'])
    matrix = np.stack(rows) if rows else np.array([])
    return ids, matrix


def _apply_index(embeddings: dict):
    """Atomically swap the in-memory index to the given embeddings dict."""
    global product_embeddings, product_ids, embedding_matrix
    ids, matrix = _rebuild_matrix(embeddings)
    with _index_lock:
        product_embeddings = embeddings
        product_ids = ids
        embedding_matrix = matrix
    if matrix.size:
        print(f"[OK] Index ready: {len(ids)} products, matrix {matrix.shape}")
    else:
        print("[WARN] Index is empty")


# Load whatever was previously persisted to disk at startup.
_initial = indexer.load_index()
if _initial:
    print(f"[OK] Loaded embeddings for {len(_initial)} products")
else:
    print(f"[WARN] No embeddings found at {indexer.EMBEDDINGS_PATH}")
    print("       The index is empty - POST /reindex or run generate_embeddings.py")
_apply_index(_initial)

# -- FastAPI App ---------------------------------------------------------------
app = FastAPI(title="NexaShop Visual Search", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    image: str  # base64 encoded image (with or without data URI prefix)


class SearchResult(BaseModel):
    product_id: int
    similarity: float
    name: str
    category: str


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model": "CLIP ViT-B/32",
        "products_indexed": len(product_embeddings),
        "device": device,
    }


@app.post("/reindex")
def reindex():
    """Rebuild the embedding index from the current database state.

    Reuses cached embeddings for products whose image hasn't changed, so only
    new/changed images are downloaded and encoded. Deleted products drop out.
    Called automatically by the admin product API on create/edit/delete.
    """
    try:
        # Snapshot the current embeddings so unchanged products can be reused.
        with _index_lock:
            current = dict(product_embeddings)

        embeddings, stats = indexer.build_index(
            model, preprocess, device, existing=current
        )
        indexer.save_index(embeddings)
        _apply_index(embeddings)

        print(
            f"[OK] Reindex complete - in_db={stats['total_in_db']} "
            f"indexed={stats['indexed']} added={stats['added']} "
            f"reused={stats['reused']} removed={stats['removed']} "
            f"failed={len(stats['failed'])}"
        )
        return {"status": "ok", **stats}
    except Exception as e:
        print(f"[ERROR] Reindex failed: {e}")
        raise HTTPException(status_code=500, detail=f"Reindex failed: {str(e)}")


@app.post("/search")
def search_by_image(request: SearchRequest):
    # Snapshot the index under the lock so a concurrent /reindex can't swap it
    # mid-search.
    with _index_lock:
        ids = product_ids
        matrix = embedding_matrix
        embeddings = product_embeddings

    if len(matrix) == 0:
        raise HTTPException(
            status_code=503,
            detail="No product embeddings loaded. POST /reindex or run generate_embeddings.py first."
        )

    try:
        # -- Decode image ------------------------------------------------------
        image_data = request.image
        # Strip data URI prefix if present (e.g., "data:image/jpeg;base64,...")
        if ',' in image_data:
            image_data = image_data.split(',', 1)[1]

        img_bytes = base64.b64decode(image_data)
        img = Image.open(BytesIO(img_bytes)).convert("RGB")

        # -- Generate embedding for the query image ----------------------------
        img_tensor = preprocess(img).unsqueeze(0).to(device)
        with torch.no_grad():
            query_embedding = model.encode_image(img_tensor)
            query_embedding = query_embedding / query_embedding.norm(dim=-1, keepdim=True)
            query_embedding = query_embedding.cpu().numpy().flatten()

        # -- Compute cosine similarities ---------------------------------------
        similarities = np.dot(matrix, query_embedding)

        # Get top K results
        top_indices = np.argsort(similarities)[::-1][:TOP_K]

        results = []
        for idx in top_indices:
            pid = ids[idx]
            score = float(similarities[idx])
            # Skip products that don't meet the minimum similarity threshold.
            # This prevents weak/irrelevant matches from showing up in results.
            if score < SIMILARITY_THRESHOLD:
                continue
            product_data = embeddings[pid]
            results.append(SearchResult(
                product_id=pid,
                similarity=round(score * 100, 1),  # Convert to percentage
                name=product_data['name'],
                category=product_data['category'],
            ))

        # Return whatever passed the threshold (may be empty — the frontend
        # handles the empty-results case with a Turkish "no match" message).
        return {"results": results}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")


# -- Run Server ----------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    print(f"\n[*] Starting Visual Search Server on http://localhost:8000")
    print(f"    Products indexed: {len(product_embeddings)}")
    print(f"    Top-K results: {TOP_K}")
    print(f"    Device: {device}")
    print("    Press Ctrl+C to stop\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
