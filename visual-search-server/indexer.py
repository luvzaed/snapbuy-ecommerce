"""
Shared indexing logic for the visual search server.

Both `generate_embeddings.py` (manual one-off run) and `main.py`'s POST /reindex
endpoint use these functions so the indexing behaviour is identical everywhere.

Product metadata (id, name, image, category) is always read from the same
Postgres/Supabase database the Next.js app uses, so search results stay in sync
with product edits and deletes.

Images are loaded from one of two sources, decided per-product by the value of
the `image` column:
  - Absolute URLs ("http://", "https://")  -> downloaded over HTTP (e.g. Unsplash)
  - Relative paths ("/images/products/..") -> read from the Next.js public/ folder
    on disk. This is where the admin product-upload API writes uploaded images.
"""

import os
import pickle

import requests
import numpy as np
from PIL import Image
from io import BytesIO
import psycopg2
from dotenv import load_dotenv

# Load .env from the parent directory (my-app/.env) so DATABASE_URL is available
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# -- Paths --------------------------------------------------------------------
# The Next.js public/ directory holds admin-uploaded images under
# public/images/products/. A relative image path like "/images/products/x.jpg"
# is resolved against this directory.
PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public'))
EMBEDDINGS_PATH = os.path.join(os.path.dirname(__file__), 'embeddings', 'products.pkl')


def load_image(image_ref: str) -> Image.Image:
    """Load a product image as a PIL RGB image.

    Handles both absolute URLs (downloaded over HTTP) and relative public paths
    (read from the local Next.js public/ folder). Raises on failure so callers
    can record the product as failed.
    """
    if not image_ref:
        raise ValueError("empty image reference")

    if image_ref.startswith("http://") or image_ref.startswith("https://"):
        # Remote image (e.g. seeded Unsplash URLs)
        response = requests.get(image_ref, timeout=15)
        response.raise_for_status()
        return Image.open(BytesIO(response.content)).convert("RGB")

    # Relative path written by the admin upload API, e.g. "/images/products/x.jpg".
    # Strip any leading slash and resolve against the Next.js public/ directory.
    relative = image_ref.lstrip("/\\")
    local_path = os.path.join(PUBLIC_DIR, *relative.split("/"))
    if not os.path.exists(local_path):
        raise FileNotFoundError(f"local image not found: {local_path}")
    return Image.open(local_path).convert("RGB")


def embed_image(img: Image.Image, model, preprocess, device) -> np.ndarray:
    """Encode a PIL image into a normalized CLIP embedding (1-D numpy array)."""
    import torch  # imported lazily so importing this module stays cheap

    img_tensor = preprocess(img).unsqueeze(0).to(device)
    with torch.no_grad():
        embedding = model.encode_image(img_tensor)
        embedding = embedding / embedding.norm(dim=-1, keepdim=True)
        return embedding.cpu().numpy().flatten()


def fetch_products_from_db():
    """Return all products as a list of (id, name, image, category) tuples.

    Reads from the same Postgres/Supabase database the Next.js app uses.
    """
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL not found in environment / .env")

    conn = psycopg2.connect(database_url)
    try:
        cur = conn.cursor()
        cur.execute('SELECT id, name, image, category FROM "Product" ORDER BY id')
        rows = cur.fetchall()
        cur.close()
        return rows
    finally:
        conn.close()


def build_index(model, preprocess, device, existing: dict | None = None):
    """Build the product embedding index from the current database state.

    Args:
        model, preprocess, device: the loaded CLIP model and its transforms.
        existing: a previously-built embeddings dict. When provided, products
            whose image URL hasn't changed reuse their cached embedding instead
            of being re-downloaded/re-encoded. Pass None for a full rebuild.

    Returns:
        (embeddings, stats) where embeddings maps product_id -> {
            'id', 'name', 'category', 'image', 'embedding'
        } and stats summarizes what happened.

    Products no longer present in the database are dropped from the result, so
    deletes propagate to search automatically.
    """
    existing = existing or {}
    products = fetch_products_from_db()

    embeddings: dict = {}
    added = 0
    reused = 0
    failed = []

    for product_id, name, image_url, category in products:
        cached = existing.get(product_id)
        # Reuse the cached embedding only when the image reference is unchanged.
        if cached and cached.get("image") == image_url and "embedding" in cached:
            embeddings[product_id] = {
                "id": product_id,
                "name": name,            # always refresh metadata (may have changed)
                "category": category,
                "image": image_url,
                "embedding": cached["embedding"],
            }
            reused += 1
            continue

        try:
            img = load_image(image_url)
            embedding = embed_image(img, model, preprocess, device)
            embeddings[product_id] = {
                "id": product_id,
                "name": name,
                "category": category,
                "image": image_url,
                "embedding": embedding,
            }
            added += 1
        except Exception as e:  # noqa: BLE001 - record and continue
            failed.append((product_id, name, str(e)))

    # Products that were in the old index but no longer exist in the DB (deletes).
    db_ids = {p[0] for p in products}
    removed = len([pid for pid in existing if pid not in db_ids])

    stats = {
        "total_in_db": len(products),
        "indexed": len(embeddings),
        "added": added,
        "reused": reused,
        "removed": removed,
        "failed": [{"id": pid, "name": pname, "error": err} for pid, pname, err in failed],
    }
    return embeddings, stats


def save_index(embeddings: dict, path: str = EMBEDDINGS_PATH) -> None:
    """Persist the embeddings dict to disk (pickle)."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        pickle.dump(embeddings, f)


def load_index(path: str = EMBEDDINGS_PATH) -> dict:
    """Load a previously-saved embeddings dict, or {} if none exists."""
    if not os.path.exists(path):
        return {}
    with open(path, "rb") as f:
        return pickle.load(f)
