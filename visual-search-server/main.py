"""
AI Visual Search Server - FastAPI + CLIP

Endpoints:
    GET  /health  -> Health check
    POST /search  -> Upload image, get matching products

Usage:
    cd visual-search-server
    python main.py
"""

import os
import sys
import io
import pickle
import base64
import torch
import open_clip
import numpy as np
from io import BytesIO
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Fix Windows console encoding for Unicode
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# -- Config -------------------------------------------------------------------
TOP_K = 3  # Number of results to return (change this to show more/fewer)
EMBEDDINGS_PATH = os.path.join(os.path.dirname(__file__), 'embeddings', 'products.pkl')

# -- Load CLIP Model ----------------------------------------------------------
print("[*] Loading CLIP model...")
device = "cuda" if torch.cuda.is_available() else "cpu"
model, _, preprocess = open_clip.create_model_and_transforms(
    'ViT-B-32', pretrained='laion2b_s34b_b79k', device=device
)
model.eval()
print(f"[OK] Model loaded on {device}")

# -- Load Product Embeddings --------------------------------------------------
if not os.path.exists(EMBEDDINGS_PATH):
    print(f"[WARN] No embeddings found at {EMBEDDINGS_PATH}")
    print("       Run `python generate_embeddings.py` first!")
    product_embeddings = {}
else:
    with open(EMBEDDINGS_PATH, 'rb') as f:
        product_embeddings = pickle.load(f)
    print(f"[OK] Loaded embeddings for {len(product_embeddings)} products")

# -- Build embedding matrix for fast similarity search -------------------------
product_ids = []
embedding_matrix = []
for pid, data in product_embeddings.items():
    product_ids.append(pid)
    embedding_matrix.append(data['embedding'])

if embedding_matrix:
    embedding_matrix = np.stack(embedding_matrix)
    print(f"[OK] Embedding matrix shape: {embedding_matrix.shape}")
else:
    embedding_matrix = np.array([])

# -- FastAPI App ---------------------------------------------------------------
app = FastAPI(title="NexaShop Visual Search", version="1.0.0")

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


@app.post("/search")
def search_by_image(request: SearchRequest):
    if len(embedding_matrix) == 0:
        raise HTTPException(
            status_code=503,
            detail="No product embeddings loaded. Run generate_embeddings.py first."
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
        similarities = np.dot(embedding_matrix, query_embedding)

        # Get top K results
        top_indices = np.argsort(similarities)[::-1][:TOP_K]

        results = []
        for idx in top_indices:
            pid = product_ids[idx]
            score = float(similarities[idx])
            product_data = product_embeddings[pid]
            results.append(SearchResult(
                product_id=pid,
                similarity=round(score * 100, 1),  # Convert to percentage
                name=product_data['name'],
                category=product_data['category'],
            ))

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
