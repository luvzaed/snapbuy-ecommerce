"""
Generate CLIP embeddings for all products in the database.
Run this script whenever you add/change/delete products.

Usage:
    cd visual-search-server
    python generate_embeddings.py
"""

import os
import sys
import io
import pickle
import requests
import torch
import open_clip
import numpy as np
from PIL import Image
from io import BytesIO
import psycopg2
from dotenv import load_dotenv

# Fix Windows console encoding for Unicode
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Load .env from the parent directory (my-app/.env)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("[ERROR] DATABASE_URL not found in .env file")
    sys.exit(1)

# -- Load CLIP Model ---------------------------------------------------------
print("[*] Loading CLIP model (ViT-B/32)...")
print("    (First run will download ~600MB - this is cached for future runs)")
device = "cuda" if torch.cuda.is_available() else "cpu"
model, _, preprocess = open_clip.create_model_and_transforms(
    'ViT-B-32', pretrained='laion2b_s34b_b79k', device=device
)
model.eval()
print(f"[OK] Model loaded on {device}")

# -- Fetch Products from DB ---------------------------------------------------
print("\n[*] Fetching products from database...")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute('SELECT id, name, image, category FROM "Product" ORDER BY id')
products = cur.fetchall()
cur.close()
conn.close()

print(f"    Found {len(products)} products")

if len(products) == 0:
    print("[WARN] No products found. Add products first, then re-run this script.")
    sys.exit(0)

# -- Generate Embeddings ------------------------------------------------------
print("\n[*] Generating embeddings...")
embeddings = {}
failed = []

for i, (product_id, name, image_url, category) in enumerate(products):
    try:
        # Download image
        response = requests.get(image_url, timeout=15)
        response.raise_for_status()
        img = Image.open(BytesIO(response.content)).convert("RGB")
        
        # Preprocess and encode
        img_tensor = preprocess(img).unsqueeze(0).to(device)
        with torch.no_grad():
            embedding = model.encode_image(img_tensor)
            # Normalize the embedding
            embedding = embedding / embedding.norm(dim=-1, keepdim=True)
            embedding = embedding.cpu().numpy().flatten()
        
        embeddings[product_id] = {
            'id': product_id,
            'name': name,
            'category': category,
            'embedding': embedding
        }
        
        progress = f"[{i+1}/{len(products)}]"
        print(f"    {progress} OK - {name}")
        
    except Exception as e:
        failed.append((product_id, name, str(e)))
        progress = f"[{i+1}/{len(products)}]"
        print(f"    {progress} FAIL - {name} -- {e}")

# -- Save Embeddings ----------------------------------------------------------
os.makedirs(os.path.join(os.path.dirname(__file__), 'embeddings'), exist_ok=True)
output_path = os.path.join(os.path.dirname(__file__), 'embeddings', 'products.pkl')

with open(output_path, 'wb') as f:
    pickle.dump(embeddings, f)

print(f"\n{'='*50}")
print(f"[OK] Embeddings saved to embeddings/products.pkl")
print(f"     Total: {len(embeddings)} products embedded")
if failed:
    print(f"     Failed: {len(failed)} products")
    for pid, pname, err in failed:
        print(f"       - {pname} (id={pid}): {err}")
print(f"{'='*50}")
print("\n[*] You can now start the server with: python main.py")
