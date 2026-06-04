"""
Generate CLIP embeddings for all products in the database.
Run this script for a full one-off rebuild of the index.

Day-to-day you don't need to run this manually: the server exposes POST /reindex
and the admin product API triggers it automatically on create/edit/delete.
This script remains handy for a cold rebuild from scratch.

Usage:
    cd visual-search-server
    python generate_embeddings.py
"""

import os
import sys
import io

import torch
import open_clip

import indexer

# Fix Windows console encoding for Unicode
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# -- Load CLIP Model ---------------------------------------------------------
print("[*] Loading CLIP model (ViT-B/32)...")
print("    (First run will download ~600MB - this is cached for future runs)")
device = "cuda" if torch.cuda.is_available() else "cpu"
model, _, preprocess = open_clip.create_model_and_transforms(
    'ViT-B-32', pretrained='laion2b_s34b_b79k', device=device
)
model.eval()
print(f"[OK] Model loaded on {device}")

# -- Build the index (full rebuild: existing=None) ----------------------------
print("\n[*] Fetching products from database and generating embeddings...")
embeddings, stats = indexer.build_index(model, preprocess, device, existing=None)

# -- Save ---------------------------------------------------------------------
indexer.save_index(embeddings)

print(f"\n{'='*50}")
print(f"[OK] Embeddings saved to embeddings/products.pkl")
print(f"     Products in DB : {stats['total_in_db']}")
print(f"     Embedded       : {stats['indexed']}")
if stats["failed"]:
    print(f"     Failed         : {len(stats['failed'])}")
    for f in stats["failed"]:
        print(f"       - {f['name']} (id={f['id']}): {f['error']}")
print(f"{'='*50}")
print("\n[*] You can now start the server with: python main.py")
