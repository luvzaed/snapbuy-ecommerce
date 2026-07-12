# PROJECT REVIEW — SnapBuy (for thesis defense presentation)

> A complete, standalone reference to how SnapBuy works, written from the actual source code. Every non-obvious claim cites the file that proves it so it can be verified. Where the code contradicts an assumption, it is flagged inline with **⚠ FLAG**.

---

## 1. ONE-PARAGRAPH SUMMARY

SnapBuy is a B2C e-commerce platform for electronics (a Bachelor's thesis project, İstanbul Gelişim Üniversitesi). It is a full storefront — browse catalog, register/login, cart, multi-step checkout, order history, reviews, and an admin panel — built on Next.js with a PostgreSQL database. Its standout feature is **AI-powered visual search**: a user uploads a photo (or uses their camera) and the system finds visually similar products in the catalog. That feature is powered by a separate Python service running the OpenCLIP ViT-B/32 model, which turns images into numeric "fingerprints" (embeddings) and ranks products by how close their fingerprint is to the uploaded photo's.

---

## 2. TECH STACK

Versions are the exact ones declared in `package.json` (Next.js side) and `visual-search-server/requirements.txt` (Python side).

### Frontend / Backend (one Next.js app does both)
| Technology | Version | Role |
|---|---|---|
| Next.js (App Router) | `^16.2.1` | Serves the storefront + admin UI **and** the REST API (`app/api/**/route.ts`). One process. |
| React / React DOM | `19.2.3` | UI runtime. Most pages are Client Components; the product detail page is a Server Component. |
| TypeScript | `^5.9.3` | Language, `strict` mode, path alias `@/* → ./*`. |
| Tailwind CSS | v4 (`@tailwindcss/postcss`) | Styling; dark mode via `next-themes ^0.4.6`. |
| lucide-react | `^0.577.0` | Icons. |
| react-hot-toast | `^2.6.0` | Toast notifications. |

### Database / ORM
| Technology | Version | Role |
|---|---|---|
| PostgreSQL on Supabase | — | Data store. Host is the Supabase connection pooler in region **`aws-1-eu-central-1`** (Frankfurt), port 5432. Confirmed from `.env` `DATABASE_URL`. |
| Prisma Client | `^7.5.0` | ORM. Uses the **driver-adapter** model: `@prisma/adapter-pg ^7.6.0` wrapping a `pg ^8.20.0` connection `Pool` (`lib/prisma.ts`). |
| pgvector | enabled, **unused** | The `vector` extension is enabled and a `Product.imageVector vector(2048)` column exists, but no code reads or writes it. See §9. |

### Auth (custom — no third-party provider)
| Technology | Version | Role |
|---|---|---|
| bcryptjs | `^3.0.3` | Password hashing/verification, **10 salt rounds** (`lib/password.ts`). |
| jsonwebtoken | `^9.0.3` | Signs/verifies the session JWT, **HS256**, **7-day** expiry (`lib/api-auth.ts`). Stored in the `auth_session` cookie. |

### Visual search sidecar (separate Python process)
| Technology | Version | Role |
|---|---|---|
| FastAPI | `0.115.12` | HTTP server exposing `/health`, `/search`, `/reindex` (`visual-search-server/main.py`). |
| Uvicorn | `0.34.3` | ASGI server; runs on **port 8000**. |
| open-clip-torch | `2.30.0` | The model: **OpenCLIP ViT-B/32**, pretrained weights **`laion2b_s34b_b79k`**. |
| PyTorch | `>=2.9.0` (installed: `2.12.0+cpu`) | Runs CLIP inference. CPU in this environment (CUDA if available). |
| NumPy | `>=2.2.0` | Holds the stacked embedding matrix; computes cosine similarity via dot product. |
| Pillow | `>=11.0.0` | Decodes/normalizes images. |
| psycopg2-binary | `>=2.9.10` | Reads product rows directly from the same Postgres DB. |
| requests | `>=2.32.0` | Downloads remote product images during indexing. |
| python-dotenv | `>=1.1.0` | Loads `../.env` so the sidecar gets `DATABASE_URL`. |

---

## 3. HOW IT RUNS

**Two servers must run at the same time:** the Next.js website *and* the Python visual-search sidecar. If the sidecar is down, the whole site still works — only image search returns an error.

### Required environment variables (`.env` in project root)
- `DATABASE_URL` — Postgres connection string (Supabase pooler). Read by both the Next.js app and the Python sidecar.
- `JWT_SECRET` — secret for signing/verifying session tokens (currently a 66-char string). **Required** — `lib/api-auth.ts` throws if it's missing (no insecure fallback).
- `VISUAL_SEARCH_URL` *(optional)* — used by the reindex trigger only; defaults to `http://localhost:8000` (`lib/reindex.ts`). **⚠ FLAG:** the search proxy itself **hardcodes** `http://localhost:8000` (`app/api/visual-search/route.ts:22`), so this env var does *not* redirect search traffic — only reindex.

### Start the Next.js app (terminal 1)
```bash
npm install
npx prisma generate          # generates the Prisma client for the driver adapter
npm run dev                  # Next.js dev server on http://localhost:3000
```

### Start the Python sidecar (terminal 2)
```bash
cd visual-search-server
python -m venv .venv         # first time only
.venv\Scripts\activate       # Windows (use source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
python generate_embeddings.py  # first time / to rebuild the index from the DB
python main.py               # FastAPI on http://localhost:8000
```
`generate_embeddings.py` reads every product from the database, downloads/encodes its image, and writes the index to `embeddings/products.pkl`. `main.py` loads that pickle at startup and serves search.

---

## 4. ARCHITECTURE OVERVIEW

There are **two running programs** that share **one database**.

1. **The Next.js app** is the whole website and its API. The browser renders pages; for data it calls `app/api/**` route handlers, which talk to PostgreSQL through Prisma (`lib/prisma.ts`). Client UI state (the logged-in user object, the cart) lives in the browser's `localStorage` via a React context (`lib/auth-context.tsx`) — but this is only for rendering; the server never trusts it.

2. **The Python sidecar** is the visual-search engine. It connects to the *same* Postgres database with `psycopg2` to read product metadata, and it owns the embedding index (the pickle file).

**A normal request** (e.g. loading the shop): browser → `GET /api/products` (Next.js route handler) → Prisma → Postgres → JSON back to the browser.

**A visual-search request** crosses the boundary between the two programs:
1. Browser turns the chosen image into a base64 data URL and calls `POST /api/visual-search` (`components/VisualSearch.tsx` → `app/api/visual-search/route.ts`).
2. The Next.js route forwards `{ image }` over HTTP to the Python sidecar at `http://localhost:8000/search`.
3. The sidecar converts the image to a 512-number embedding, compares it to every product's precomputed embedding, and returns the closest product IDs + scores.
4. The Next.js route takes those IDs, loads the full product rows from Postgres via Prisma, attaches the similarity scores, and returns them to the browser.
5. The browser shows the matched products with a "%NN match" badge.

**Where data lives:** users, products, orders, reviews, newsletter emails → PostgreSQL. Product image *embeddings* → the pickle file `visual-search-server/embeddings/products.pkl` (NOT in the database). Uploaded product image *files* → `public/images/products/`. Session token → the `auth_session` browser cookie.

---

## 5. FEATURE-BY-FEATURE BREAKDOWN

### 5.1 User auth — register, login, logout (bcryptjs + JWT cookie)
- **Register** (`app/register/page.tsx` → `POST /api/users`, `app/api/users/route.ts`): validates the email, hashes the password with bcryptjs, and **always creates role `USER`** — any `role` in the request body is ignored, so registration can never mint an admin. This endpoint does **not** set a cookie; the register page therefore immediately calls the login endpoint with the same credentials ("auto-login") so the session cookie gets set.
- **Login** (`app/login/page.tsx` → `POST /api/users/login`, `app/api/users/login/route.ts`): finds the user, verifies the password, then signs a JWT (`signSession`, `lib/api-auth.ts`) carrying `{ id, role }` and sets it as the `auth_session` cookie (7-day `maxAge`, `sameSite: lax`, `secure` in production). The DB stores roles as `USER`/`ADMIN`; the token carries them lowercased (`user`/`admin`). There's also a legacy fallback: if a stored password isn't a bcrypt hash, it's compared as plaintext and then lazily re-hashed on successful login (`lib/password.ts`).
- **Logout** (`lib/auth-context.tsx`): client-side only — clears the `localStorage` user/cart and the (JS-readable) cookie. **⚠ FLAG:** there is **no server-side logout/revocation**; a token stays valid until its 7-day expiry regardless.

### 5.2 Route protection — three layers, used for different things
1. **Edge middleware** (`proxy.ts`, matcher `['/admin/:path*']`): runs on the Edge runtime, where `jsonwebtoken` can't run, so it re-verifies the **same HS256 signature using the Web Crypto API**. No/invalid/expired token → redirect to `/login`; valid but not `admin` → redirect to `/`. This blocks admin *pages* before they load.
2. **Per-route checks** (the real enforcement): every protected API handler calls `getSession(req)` and `isAdmin()` / `role === 'admin'` (e.g. `app/api/products/route.ts`, `app/api/users/route.ts`, `app/api/orders/route.ts`). Orders also have **IDOR guards** so a user can only read their own orders (`app/api/orders/route.ts`, `app/api/orders/[id]/route.ts`).
3. **Client-side guards** (UX only): `/dashboard`, `/profile`, `/checkout` redirect to `/login` via `useEffect` when there's no user. These don't protect data — the APIs behind them do.

### 5.3 Product catalog + Prisma schema
Defined in `prisma/schema.prisma`. Enum `Role { USER, ADMIN }`. Models and relations:
- **User** — `id`, `email` (unique), `name?`, `password` (bcrypt hash), `phone?`, `address?`, `role`, timestamps. → one-to-many **Order**, one-to-many **Review**.
- **Product** — `id`, `name`, `price`, `stock` (default 0), `image`, `description`, `category` (default `"General"`), `rating?`, `reviewCount` (default 0), `imageVector vector(2048)?` *(unused — see §9)*, timestamps. → one-to-many **OrderItem**, one-to-many **Review**. `rating`/`reviewCount` are a denormalized cache recomputed by the reviews API.
- **Order** — `id`, `total`, `status` (default `"PENDING"`), `shipping Json?` (delivery/contact snapshot captured at checkout — no card data), `userId`, timestamps. → belongs to **User**, one-to-many **OrderItem**.
- **OrderItem** — `id`, `quantity`, `price` (price *at time of order*), `orderId`, `productId`. → belongs to **Order** and **Product**. No cascade delete (the order-delete route removes items first).
- **Review** — `id`, `rating` (Int 1–5), `comment?`, `userId`, `productId`, timestamps, `@@unique([userId, productId])` (one review per user per product, enforced via `upsert` in `app/api/reviews/route.ts`). → belongs to **User** and **Product**.
- **Newsletter** — `id`, `email` (unique), `createdAt`.

Catalog APIs: `GET /api/products` (public list), `GET /api/products/[id]` (public single), and admin-only `POST/PUT/DELETE` for create/edit/delete with image upload to `public/images/products/`. Seed data is in `data/products.csv` (45 rows) and imported by `scripts/import-products.ts`. **⚠ FLAG:** the importer skips rows whose product `name` already exists or that fail to parse, so the live DB currently holds **16 products, not 45** — see §7.

### 5.4 Visual search (the core feature — full pipeline)
Plain-language pipeline (files: `components/VisualSearch.tsx`, `app/api/visual-search/route.ts`, `visual-search-server/main.py`, `indexer.py`):
1. **Upload** — the user picks a file, drags one in, or snaps a camera photo. The image becomes a base64 string and is POSTed to `/api/visual-search`.
2. **Forward** — the Next.js route forwards the image to the Python sidecar's `/search`.
3. **Embed** — the sidecar runs the image through OpenCLIP ViT-B/32, producing a **512-dimensional embedding** that is L2-normalized (made unit length).
4. **Compare** — it computes **cosine similarity** between the query embedding and every product embedding in `products.pkl`. Because all vectors are unit length, cosine similarity is just a dot product: `np.dot(matrix, query)` (`main.py:207`).
5. **Rank + filter** — it takes the **top 3** (`TOP_K = 3`) and drops anything below the **0.55** similarity threshold (`SIMILARITY_THRESHOLD = 0.55`). It returns the surviving product IDs with their scores (as percentages).
6. **Hydrate + show** — the Next.js route loads the full product rows from Postgres, attaches the scores, and the browser renders the matches with a "%NN eşleşme" badge.

The index is built ahead of time (`generate_embeddings.py` / the `/reindex` endpoint) by reading every product from the DB, encoding its image once, and saving the dict `product_id → { id, name, category, image, embedding }` to the pickle. It's held in memory as a NumPy matrix for fast comparison.

### 5.5 Cart + checkout (server-side price recomputation, atomic stock decrement)
- The cart lives in `localStorage` (`lib/auth-context.tsx`), stock-capped on the client. Checkout (`app/checkout/page.tsx`) is a 3-step flow: delivery → payment (card formatting only, **demo — no real payment, no card data stored**) → review.
- On submit, `POST /api/orders` (`app/api/orders/route.ts`) does the real work inside **one Prisma transaction**: it derives the user from the **session** (never the body), re-reads real prices and stock from the DB, **recomputes the subtotal + 20% tax + total server-side** (ignoring any client-supplied total), creates the order and items, then **atomically decrements stock** with a conditional `updateMany(where: { stock: { gte: quantity } })`. If a concurrent order already drained the stock, that update matches 0 rows and the whole transaction rolls back. This is what prevents **price tampering** and **overselling**.

### 5.6 Admin panel
- UI under `app/admin/*` (`layout.tsx` shows the sidebar only when the client thinks the user is admin; the real gate is `proxy.ts` + per-route checks). Features: product CRUD with image upload, order list + status changes (`PATCH /api/orders/[id]`, valid statuses `PENDING/PROCESSING/SHIPPED/DELIVERED`), user list/edit/delete + role changes, and a top-products analytics endpoint (`app/api/admin/top-products/route.ts`). Every admin API independently verifies the signed JWT and `role === 'admin'`.
- Product create/edit/delete also fire a non-blocking reindex request to the sidecar (`lib/reindex.ts`) so search stays in sync — see the limitation in §9.

### 5.7 Newsletter signup
- `components/NewsletterSignup.tsx` → `POST /api/newsletter` (`app/api/newsletter/route.ts`): validates + lowercases the email and inserts a row into the `Newsletter` table (unique email; duplicates return a 400). No email is actually sent — it's just a stored subscription.

---

## 6. THE VISUAL SEARCH, EXPLAINED SIMPLY

**What an embedding is.** OpenCLIP looks at an image and summarizes it as a list of **512 numbers**. Think of those numbers as a "fingerprint" of what the image *looks like and means* — its shapes, colors, and the kind of object it is. The key property: **images that look similar get similar fingerprints**, and images that look different get different ones. CLIP learned this by studying ~2 billion image-and-caption pairs from the internet, so its fingerprints capture real visual meaning, not just raw pixels.

**What "512-dimensional vector" means.** A single number places something on a line (1 dimension). Two numbers place a point on a map (2 dimensions: left-right and up-down). 512 numbers place a point in a 512-dimensional "space" — we can't picture it, but the math works the same as a map: every image becomes a *location*, and locations that are near each other belong to images that look alike.

**What cosine similarity measures.** To ask "how similar are two images?", we measure the **angle between their two fingerprint-arrows** pointing from the origin to each location. A small angle (arrows pointing almost the same way) = very similar; a wide angle = different. Cosine similarity is just that angle expressed as a number from −1 to 1, where 1 means identical direction. Because we make every fingerprint the same length first, computing this angle reduces to a single fast multiplication step (a dot product).

**Why this approach works.** We compute each product's fingerprint **once** and store all of them. When a user uploads a photo, we compute its fingerprint the same way and find the products whose fingerprints sit **closest** to it — the nearest neighbors in that 512-dimensional space. The 3 nearest that are at least 55% similar are shown.

**The analogy to teach back:** *Imagine every product photo is pinned to a giant invisible map according to what it looks like — all the smartphones cluster in one area, the headphones in another. When you upload a photo, we pin it to the same map and simply hand back the products nearest to your pin.* That's visual search.

---

## 7. KEY NUMBERS TO KNOW

| Number | Value | Where |
|---|---|---|
| Embedding dimension | **512** | OpenCLIP ViT-B/32 output (verified by loading `products.pkl`) |
| Results returned (TOP_K) | **3** | `visual-search-server/main.py:47` |
| Similarity threshold | **0.55** (shown as 55%) | `visual-search-server/main.py:56` |
| bcrypt salt rounds | **10** | `lib/password.ts` |
| JWT algorithm | **HS256** | `lib/api-auth.ts` |
| Token lifetime | **7 days** | `lib/api-auth.ts` / login route cookie `maxAge` |
| Checkout tax rate | **20%** (KDV) | `app/api/orders/route.ts` |
| Products in seed CSV | **45** | `data/products.csv` |
| Products actually in DB / index | **16** | live DB + `products.pkl` (verified) |
| Pretrained CLIP weights | **laion2b_s34b_b79k** | `main.py` |
| Sidecar port | **8000** | `main.py` (uvicorn) |
| DB region | Supabase **aws-1-eu-central-1** (Frankfurt) | `.env` `DATABASE_URL` |

**⚠ FLAG (most important for the demo):** the catalog has **45 products in the CSV but only 16 in the live database**, so only 16 are searchable. This is not an embedding bug — `generate_embeddings.py` correctly embeds whatever is in the DB, and the DB only has 16 rows (the CSV import skipped the rest). If you want all 45 searchable for the defense, you must first import the CSV into the database (`scripts/import-products.ts`) and *then* rebuild the index. That step writes to the database.

---

## 8. STRENGTHS (defend these with confidence)

- **A real ML feature, not a gimmick.** CLIP embeddings + cosine similarity is the same technique used in production image-retrieval systems; the pipeline is genuine (image → 512-d vector → nearest neighbors), not a keyword trick.
- **Secure-by-design checkout.** Prices and totals are recomputed server-side from the database, the user is taken from the session, and stock is decremented atomically inside a transaction — so the client cannot tamper with prices and concurrent orders cannot oversell (`app/api/orders/route.ts`).
- **Sound auth fundamentals.** Passwords are bcrypt-hashed (10 rounds); the JWT **algorithm is pinned to HS256** so an `alg:none` forgery is rejected; the signing secret is required with no insecure fallback; **registration can never create an admin**; and **orders have IDOR guards** (`lib/api-auth.ts`, `app/api/users/route.ts`, `app/api/orders/route.ts`).
- **Clean, modern, consistent stack.** Next.js 16 (App Router) / React 19 / Prisma 7 with the driver-adapter model, TypeScript strict mode, a clear separation between the web app and the AI sidecar.
- **Defense-in-depth on admin routes.** Edge middleware *and* per-route authorization, with the client UI state never trusted by the server.

---

## 9. LIMITATIONS + PRODUCTION UPGRADE PATH

Honest weaknesses, each with the production-grade fix. (These mirror `DEFENSE_BRIEF.md §7`, verified against the code.)

- **No formal evaluation of the visual search.** There is no labeled test set and no accuracy metric anywhere; `TOP_K = 3` and the `0.55` threshold are empirically hand-tuned (the comment in `main.py:54` even calls 0.55 "a good starting point"). I cannot currently quantify precision or recall. **Fix:** build a labeled query set (query image → correct product), measure precision@1 / recall@3 / mAP, and choose the threshold by sweeping it on a held-out split instead of by eye.

- **Linear-scan similarity has a scalability ceiling.** Search compares the query against *every* product embedding on every request — an exact brute-force scan held in one process's memory (`main.py:207`). Fine at 16 products; it scales acceptably to roughly the ~10k–100k-vector range before latency, single-process serialization, and RAM become problems. **Fix:** move to an approximate-nearest-neighbor index — FAISS (HNSW/IVF) in-process, or a vector database (pgvector with an HNSW index, or Qdrant/Milvus) for a persistent, network-accessible, scalable store.

- **pgvector column is dead code with the wrong dimension.** `schema.prisma` declares `imageVector vector(2048)` and the `vector` extension is enabled, but **no code reads or writes it** — all matching happens in the Python pickle. Worse, the declared width is **2048** while ViT-B/32 actually emits **512** (likely copied from an earlier ResNet-style design). **Fix:** either remove the column/extension, or — if adopting the pgvector path above — redeclare it `vector(512)`, backfill it during indexing, and run nearest-neighbor queries in Postgres so schema and implementation finally agree.

- **`auth_session` cookie is `httpOnly: false`.** It's deliberately readable by JavaScript so client-side logout can clear it (`app/api/users/login/route.ts:74`), but that means a single XSS bug could steal the token and fully impersonate the user. **Fix:** set `httpOnly: true`, move logout to a server endpoint that clears the cookie, and keep `Secure` always on.

- **No server-side JWT revocation (7-day lifetime).** "Logout" only clears the client; a leaked token stays valid until it expires (`lib/auth-context.tsx`, `lib/api-auth.ts`). **Fix:** shorten the access token and add refresh tokens, or keep a server-side session/revocation store (a `sessionId` claim checked per request) so logout, password change, or role change can invalidate sessions immediately.

- **No rate limiting on login.** `POST /api/users/login` accepts unlimited attempts — bcrypt slows each guess but nothing stops brute-force or password spraying. **Fix:** per-IP and per-account rate limiting (e.g. a Redis sliding-window limiter), exponential backoff / temporary lockout after N failures, optionally a CAPTCHA.

- **Reindex on product changes is fire-and-forget with no retry.** Create/edit/delete calls `triggerVisualSearchReindex()`, an un-awaited request whose only failure handling is a `console.warn` (`lib/reindex.ts`). If the sidecar is down, the index silently goes stale and nothing retries. **Fix:** replace it with a durable job queue (BullMQ/Redis or a DB-backed outbox) that retries until the sidecar confirms, or a periodic reconciliation job that diffs the DB against the index.

- **(Related) `next/image` allows any remote host.** `next.config.ts` sets `remotePatterns` to `hostname: "**"`, turning the image optimizer into an open proxy / mild SSRF vector. **Fix:** restrict it to a known allow-list of image hosts and serve admin-uploaded images from your own storage.

---

### Document provenance
Written by reading the source on 2026-06-20. Companion documents in this repo: `DEFENSE_BRIEF.md` (defense-oriented deep dive + examiner Q&A) and `docs/walkthrough.md` (the original code-derived reference). All three agree; the only correction worth repeating is the **16-vs-45 product count** (§7) — the database, not the embeddings, is the limiting factor.
