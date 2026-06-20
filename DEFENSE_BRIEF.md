# SnapBuy — Thesis Defense Technical Brief

> Written by reading the actual source on 2026-06-20. Every claim below is grounded in a real file; file:line references are given so you can open and confirm. Where the code is broken, stale, or contradicts its own comments/docs, it is called out explicitly. No marketing language.
>
> A separate, accurate reference already exists at `docs/walkthrough.md` — this brief does **not** contradict it; it extends it toward defense (weak points + Q&A) and corrects one stale claim (see §3 and §4).
>
> **The single most important fact to internalize before you walk in:** the live visual-search index currently contains **16 products**, not the 45 in the seed CSV. Verified by loading `visual-search-server/embeddings/products.pkl` directly. If the examiner uploads a photo of a product that isn't one of those 16, search returns nothing — and that's a real, demonstrable gap.

---

## 1. INVENTORY

### 1.1 Top-level directories (one line each)

| Directory | Role |
|---|---|
| `app/` | Next.js App Router — all pages (storefront, admin) **and** backend API route handlers under `app/api/`. |
| `components/` | Reusable React client components (Header, VisualSearch modal, checkout inputs, etc.). |
| `lib/` | Shared server/client logic: Prisma client, JWT auth, password hashing, client auth context, reindex trigger, types. |
| `prisma/` | `schema.prisma` data model + 4 SQL migrations. |
| `visual-search-server/` | The Python FastAPI + OpenCLIP microservice (the AI feature). Self-contained, separate runtime. |
| `scripts/` | Dev/ops utilities: CSV product seeder, user inspector, API smoke test. |
| `data/` | `products.csv` — 45 seed products (46 lines incl. header). |
| `public/` | Static assets, incl. `images/products/` where admin-uploaded images are written. |
| `docs/` | `walkthrough.md` — the accurate code-derived reference. |
| `.venv/` | Python virtualenv for the sidecar (gitignored). |
| `.next/`, `node_modules/` | Build output / JS deps (gitignored). |

### 1.2 The two runtimes and their entry points

**Runtime A — Next.js 16 app (Node, the whole storefront + admin + API).**
- Entry / boot: `next dev` (package.json `scripts.dev`), root layout `app/layout.tsx`, edge proxy `proxy.ts`.
- Serves the UI **and** the REST API (`app/api/**/route.ts`). One process.

**Runtime B — Python FastAPI "visual search" sidecar.**
- Entry point: `visual-search-server/main.py`, run with `python main.py` → `uvicorn.run(app, host="0.0.0.0", port=8000)` (main.py:244).
- Loads the CLIP model once at import time (main.py:59-65), loads the pickle index at startup (main.py:102-108), exposes `GET /health`, `POST /search`, `POST /reindex`.

They are **separate OS processes** that talk over HTTP on `localhost:8000` and **share the same Postgres database** (the sidecar connects with `psycopg2` using the same `DATABASE_URL` from `.env`).

### 1.3 External dependencies that do real work

**Next.js side (`package.json` dependencies):**
| Package | Real job |
|---|---|
| `next`, `react`, `react-dom` | Framework + UI runtime. |
| `@prisma/client` + `@prisma/adapter-pg` + `pg` | ORM over Postgres via the driver-adapter model (`lib/prisma.ts`: `pg.Pool` wrapped by `PrismaPg`). |
| `bcryptjs` | Password hashing/verification (`lib/password.ts`, 10 salt rounds). |
| `jsonwebtoken` | Sign/verify the `auth_session` JWT (`lib/api-auth.ts`, HS256). |
| `next-themes` | Dark/light mode. |
| `lucide-react` | Icons. |
| `react-hot-toast` | Toast notifications. |
| `csv-parser` | Used by `scripts/import-products.ts` to seed products from CSV. |
| `fs` | Junk dependency — the npm `fs@0.0.1-security` placeholder package. Does nothing; real fs comes from Node. (Worth removing; an examiner skimming `package.json` may ask.) |

**Python side (`visual-search-server/requirements.txt`):**
| Package | Real job |
|---|---|
| `fastapi` + `uvicorn` | HTTP server / ASGI runtime. |
| `open-clip-torch` (2.30.0) + `torch` + `torchvision` | The CLIP model `ViT-B-32` and image preprocessing. |
| `numpy` | Stores the stacked embedding matrix; computes cosine similarity via dot product. |
| `Pillow` | Decode/convert uploaded + product images to RGB. |
| `requests` | Download remote (e.g. Unsplash) product images during indexing. |
| `psycopg2-binary` | Read product rows directly from Postgres. |
| `python-dotenv` | Load `../.env` so the sidecar gets `DATABASE_URL`. |

---

## 2. ARCHITECTURE WALKTHROUGH

### 2.1 Authentication

**(a) What it does.** Custom auth — no third-party provider. Passwords are bcrypt-hashed; the session is a signed JWT in the `auth_session` cookie. (Supabase is used *only* as the Postgres host, not for auth.)

**(b) Files.** `lib/password.ts`, `lib/api-auth.ts`, `app/api/users/login/route.ts`, `app/api/users/route.ts` (registration), `lib/auth-context.tsx` (client state), `proxy.ts` (edge verification).

**(c) Data flow.**
1. **Register** (`app/api/users/route.ts:36`): validates email regex, `hashPassword()` (bcryptjs, `SALT_ROUNDS = 10`), **always** creates `role: "USER"` — any `role` in the body is ignored (line 55, comment: "public registration can never create an admin"). Does **not** set a cookie. The register page then calls login to obtain the cookie ("auto-login").
2. **Login** (`app/api/users/login/route.ts`): finds user by email → `verifyPassword()` → if the stored value wasn't a bcrypt hash, lazily re-hash it (lines 45-54) → build `userData` with `role: user.role.toLowerCase()` (line 61; DB stores `USER`/`ADMIN`, JWT carries `user`/`admin`) → `signSession({id, role})` → set cookie `auth_session` (lines 72-79).
3. **Cookie attributes** (login route:73-79): `httpOnly: false`, `secure` only in production, `sameSite: 'lax'`, `path: '/'`, `maxAge` = 7 days.
4. **JWT** (`lib/api-auth.ts`): `jwt.sign({id, role}, JWT_SECRET, {algorithm:'HS256', expiresIn:'7d'})`. `getSession()` verifies with **algorithm pinned to `['HS256']`** (line 43) so a forged `alg:none` token is rejected; validates payload shape; returns `{id, role}` or `null`.
5. **Secret**: `getSecret()` throws if `JWT_SECRET` is unset (no insecure fallback). In `.env`, `JWT_SECRET` is a 66-char string (confirmed present, not committed — `.env*` is gitignored).

**(d) Assumptions/limitations baked in.**
- `httpOnly: false` is deliberate (client logout clears it) but means the token is **readable by JS → stealable via XSS** (see §4).
- **Logout is client-only** (`auth-context.tsx:56`): it clears `localStorage` and the (JS-readable) cookie, but there is **no server-side revocation**. A token already captured stays valid until its 7-day `exp`. There is no token blacklist.
- Legacy plaintext-password fallback (`password.ts:27`) still exists.

### 2.2 Route protection — three different mechanisms, on purpose

There are **three** independent guards. They protect different things and an examiner will probe why.

**1. `proxy.ts` — Edge middleware, `/admin/*` UI only.**
- Next.js 16 renamed `middleware` → `proxy`; the file must be `proxy.ts` and export `proxy` (proxy.ts:84). `config.matcher = ['/admin/:path*']` (line 114).
- Runs on the **Edge runtime where `jsonwebtoken` (Node crypto) cannot run**, so it re-implements HS256 verification using the **Web Crypto API** (`crypto.subtle.verify`, lines 54-68) and manual base64url decoding. Same secret, same algorithm as `lib/api-auth.ts`.
- Logic: no/invalid/expired token → delete cookie, redirect to `/login?redirect=…`; valid but `role !== 'admin'` → redirect to `/`.
- **Why here:** stops a non-admin from even loading the admin *pages* at the edge, before any server component runs.

**2. Per-route `getSession()` / `isAdmin()` — the real enforcement.**
- Every protected API handler calls `getSession(req)` and (where needed) `isAdmin(session)` or `session.role !== 'admin'`. Examples: `app/api/products/route.ts:33-39` (POST admin-only), `app/api/users/route.ts:7-14` (GET admin-only), `app/api/orders/route.ts` (session + IDOR guards), `app/api/admin/top-products/route.ts:7-13`.
- **Why here:** the proxy only covers `/admin/*` page navigations. The **APIs are the authoritative gate** — they re-verify the signed cookie on every call, independent of any UI. This is the layer that actually protects data.

**3. Client-side `useEffect` redirects — storefront pages only.**
- `/dashboard`, `/profile`, `/checkout` guard themselves with client-side redirects to `/login` when `!user` after `loading` resolves (e.g. `checkout/page.tsx:213-220`).
- **Why here:** these are UX redirects, not security. The data behind them is still protected by the session-guarded APIs. The page shell may briefly render for a tampered client, but no protected data is returned because the API rejects the request.

**Key point to state plainly:** `localStorage['shop_user']` (and thus `user.role` in `auth-context`) is **never trusted by the server**. The admin layout shows its sidebar when `localStorage` says `role === 'admin'` (`admin/layout.tsx:28,47`), so a tampered client could *see admin chrome* — but every admin API call still fails authorization because it checks the signed JWT, and the proxy redirects the page anyway.

### 2.3 Visual search (the headline feature) — read this section twice

**(a) What it does.** User uploads or photographs an image; the system returns up to 3 catalog products whose images are most visually similar, above a 55% similarity floor.

**(b) Files.** `components/VisualSearch.tsx` (modal UI), `app/api/visual-search/route.ts` (Next.js proxy), `visual-search-server/main.py` (`/search`), `visual-search-server/indexer.py` (build/load/save index), `visual-search-server/generate_embeddings.py` (cold rebuild), `embeddings/products.pkl` (persisted index).

**(c) Data flow, step by step.**
1. **Browser** (`VisualSearch.tsx`): file picker / drag-drop / camera capture → image becomes a **base64 data URL** (FileReader or `canvas.toDataURL('image/jpeg', 0.92)`). On "Görselle Ara" → `POST /api/visual-search` with `{ image }` (handleSearch, lines 127-146).
2. **Next.js route** (`app/api/visual-search/route.ts:22`): forwards `{ image }` to **`http://localhost:8000/search`** — note this URL is **hardcoded** (unlike `reindex.ts`, which uses `VISUAL_SEARCH_URL`). This will break in any non-local deployment.
3. **Python `/search`** (`main.py:174`):
   - Snapshots the index under `_index_lock` (lines 178-181) so a concurrent `/reindex` can't swap it mid-search.
   - If the matrix is empty → HTTP 503.
   - Strips the `data:` URI prefix, `base64.b64decode`, `PIL.Image.open(...).convert("RGB")` (lines 191-197).
   - **Embed:** `preprocess(img)` (resize/crop to 224×224, normalize) → `model.encode_image(...)` → **divide by L2 norm** → numpy 1-D array of length **512** (lines 200-204).
   - **Similarity:** `similarities = np.dot(matrix, query_embedding)` (line 207). Because both the stored vectors and the query are unit-normalized, this dot product **is** cosine similarity (cos θ = a·b when ‖a‖=‖b‖=1).
   - **Top-K:** `np.argsort(similarities)[::-1][:TOP_K]`, `TOP_K = 3` (line 47, 210).
   - **Threshold:** skip any result with `score < SIMILARITY_THRESHOLD` (= **0.55**, line 56, 218). Surviving scores returned as percentages `round(score*100, 1)`.
   - Returns `{ results: [{ product_id, similarity, name, category }] }`.
4. **Next.js route** takes the `product_id`s, re-loads full product rows from Postgres via Prisma (`findMany({where:{id:{in}}})`, line 47-49), merges in the similarity score preserving rank, returns `{ products: [...] }`. (It **ignores** the name/category Python already returned — redundant but harmless.)
5. **Browser** renders each match with a "%NN eşleşme" badge linking to `/product/[id]`.

**What OpenCLIP ViT-B/32 actually does (so you can answer "explain the model").** CLIP (Contrastive Language–Image Pre-training) is a dual-encoder model trained to put an image and its caption near each other in a shared vector space. `ViT-B-32` is the **image encoder**: a Vision Transformer, "Base" size, that splits the 224×224 image into **32×32 pixel patches** (hence "/32"), embeds each patch, runs transformer self-attention, and outputs a single **512-dimensional** vector summarizing the image's semantic content. The weights `laion2b_s34b_b79k` were trained by LAION on ~2B image-text pairs. **Crucially: it is a general-purpose model, not fine-tuned on this product catalog.** It measures *visual/semantic* similarity ("this looks like a smartphone"), not product *identity* ("this is exactly SKU 50").

**How `products.pkl` is structured (verified by loading it).** A Python pickle of a dict: `product_id (int) → { 'id', 'name', 'category', 'image', 'embedding' }`, where `embedding` is a numpy `float32` array of shape `(512,)`, L2-normalized (norm = 1.0). At startup `main.py` stacks these into `embedding_matrix` (numpy, shape `(N, 512)`). **Confirmed current contents: N = 16 products, matrix shape (16, 512), 32 KB of float data.** (File last built 2026-05-31.)

**What TOP_K=3 and threshold 0.55 mean in practice.**
- `TOP_K=3`: return at most the 3 highest-scoring products. Pure UX/presentation choice; nothing statistical.
- `0.55`: a hand-tuned cutoff. The code comment itself admits it's "a good starting point" (main.py:54). Below it, results are dropped as "irrelevant." It is **not** derived from any evaluation — it's a magic number (see §4). In practice it means: an uploaded image must reach ≥55% cosine similarity to *some* of the 16 indexed images or the user gets "Benzer ürün bulunamadı."

**(d) Assumptions / limitations baked in.**
- The catalog images themselves are the ground truth; there is no per-product multi-view or text signal — one image → one vector.
- CLIP similarity ≠ same product. Two visually similar but different phones can score high; the same product on a different background/lighting can score low.
- The index is only as fresh as the last successful reindex (currently 16 of 45). Stale by design unless the sidecar is up during every product mutation.
- Hardcoded `localhost:8000` in the proxy route.

### 2.4 Product catalog & Prisma schema (`prisma/schema.prisma`)

Provider `postgresql`; `previewFeatures=["postgresqlExtensions"]`; `extensions=[vector]`. Enum `Role { USER, ADMIN }`.

| Model | Fields (used?) | Relations |
|---|---|---|
| **User** | `id`, `email` (unique), `name?`, `password` (bcrypt), `phone?`, `address?`, `role`, timestamps. `phone`/`address` exist but are **largely unused** — checkout stores its own shipping JSON on the Order, not on the User. | `1—* Order`, `1—* Review` |
| **Product** | `id`, `name`, `price`, `stock` (def 0), `image`, `description`, `category` (def "General"), `rating?`, `reviewCount` (def 0), **`imageVector Unsupported("vector(2048)")?`**, timestamps. | `1—* OrderItem`, `1—* Review` |
| **Order** | `id`, `total`, `status` (string, def "PENDING"), `shipping Json?`, `userId`, timestamps. | `*—1 User`, `1—* OrderItem` |
| **OrderItem** | `id`, `quantity`, `price` (price *at order time*), `orderId`, `productId`. No cascade delete. | `*—1 Order`, `*—1 Product` |
| **Review** | `id`, `rating` (Int), `comment?`, `userId`, `productId`, timestamps, `@@unique([userId, productId])`. | `*—1 User`, `*—1 Product` |
| **Newsletter** | `id`, `email` (unique), `createdAt`. | — |

- `Product.rating` / `reviewCount` are a **denormalized cache** recomputed by the reviews API (best-effort). They can drift if a recompute fails.
- `Product.imageVector vector(2048)` — **dead column** (see §2.8).

### 2.5 Checkout flow

**Files:** `app/checkout/page.tsx` (3-step UI), `lib/auth-context.tsx` (`placeOrder`), `app/api/orders/route.ts` (POST).
1. Cart lives in `localStorage` via `auth-context`. Checkout has 3 steps: Teslimat (shipping/contact) → Ödeme (card formatting only, demo) → İnceleme (review).
2. On load, checkout re-validates cart stock against `/api/products` and caps/bounces over-stock items (`checkout/page.tsx:161-210`).
3. "Sipariş Ver" → `placeOrder(shipping, undefined, total)` → `POST /api/orders` with `{ items:[{productId,quantity,price}], total, shipping, payment }`.
4. **Server is the authority** (`orders/route.ts:81`):
   - `userId` is taken from the **session**, never the body (line 89).
   - Everything runs in **one Prisma transaction** (line 107): re-fetch products, validate existence + stock, **recompute subtotal from real DB prices**, add **20% tax** (`tax = subtotal*0.20`, line 139), create Order + OrderItems with DB prices, then **atomically decrement stock** with a conditional `updateMany({where:{id, stock:{gte:qty}}})` — if `count===0` it throws and the whole transaction rolls back (lines 176-187). This is the anti-overselling guard.
   - **Client `total`, `price`, and `payment` are ignored.** Card data is never persisted — only `shipping` JSON is stored (line 149, comment "no card data").

### 2.6 Admin panel

- **UI:** `app/admin/layout.tsx` + `page.tsx` (overview/stats), `products/`, `orders/`, `users/`.
- **Protected by:** (1) `proxy.ts` edge gate on `/admin/*`; (2) every admin API checks `isAdmin`/`role==='admin'`. The layout itself only decides whether to render the sidebar based on the (untrusted) localStorage role.
- **Can do:** product CRUD incl. image upload (`POST/PUT/DELETE /api/products[/id]`, multipart → `public/images/products/`), each triggering a non-blocking visual-search reindex; order status changes (`PATCH /api/orders/[id]`, valid set `PENDING/PROCESSING/SHIPPED/DELIVERED`) and order delete (items deleted first, no DB cascade); user list/edit/delete and role changes; top-products analytics.

### 2.7 Newsletter signup

- **Files:** `components/NewsletterSignup.tsx` → `POST /api/newsletter`.
- Validates + lowercases the email (`newsletter/route.ts:10-17`), inserts into `Newsletter` (unique email). Duplicate → Prisma `P2002` → 400 "Bu e-posta zaten kayıtlı." No auth, no double-opt-in, no email is ever actually sent — it's just a row in a table.

### 2.8 pgvector column — confirmed DEAD CODE

- `Product.imageVector Unsupported("vector(2048)")?` exists in `schema.prisma:40` and is created by `prisma/migrations/20260328134709_init_snapbuy_schema/migration.sql:27` (`"imageVector" vector(2048)`).
- **Searched the entire codebase: nothing reads or writes `imageVector`.** All embedding storage and matching happen in the Python sidecar via pickle + in-memory NumPy. The `vector` extension and column are **provisioned but never wired up**.
- **Worse: the dimension is wrong.** The column is `vector(2048)`, but ViT-B/32 emits **512**-dim vectors (verified from the pickle). So even if someone tried to use it, it wouldn't fit. The 2048 strongly implies it was copied from an earlier ResNet-style design (ResNet-50 penultimate layer = 2048-d).
- **Defense line:** "pgvector is provisioned in the schema as a forward-looking option, but the current implementation deliberately keeps embeddings in the Python service. The column is not used by any code path, and I'm aware its declared dimension (2048) doesn't match the model's output (512) — it's vestigial."

---

## 3. CROSS-SYSTEM QUESTIONS

### 3.1 How do the Next.js app and Python sidecar communicate?

Plain HTTP/JSON over `localhost:8000`. Two directions:

**Search (Next.js → Python).** `app/api/visual-search/route.ts:22`:
```js
const pythonResponse = await fetch("http://localhost:8000/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ image }),   // image = base64 data URL
});
```
- Request shape: `{ "image": "data:image/jpeg;base64,...." }`.
- Python response shape: `{ "results": [ { "product_id": 50, "similarity": 87.3, "name": "...", "category": "..." }, ... ] }`.
- Next.js then returns to the browser: `{ "products": [ {<full product row>, "similarity": 87.3}, ... ] }`.

**Reindex (Next.js → Python).** `lib/reindex.ts:15` — fire-and-forget `POST ${VISUAL_SEARCH_URL}/reindex` (default `http://localhost:8000`), not awaited. Triggered from product create/update/delete.

**Shared DB (Python → Postgres).** The sidecar reads products directly: `indexer.py:87` `SELECT id, name, image, category FROM "Product" ORDER BY id` via `psycopg2`.

### 3.2 What happens if the Python sidecar is down?

Two distinct failure paths:

**Search path** (`app/api/visual-search/route.ts:63-78`): the `fetch` to `localhost:8000` throws a `TypeError` (connection refused). The catch block detects `error.message.includes("fetch")` and returns **HTTP 503** with the message *"Visual search server is not running. Start it with: cd visual-search-server && python main.py"*. `VisualSearch.tsx` surfaces this as a red error banner. **The rest of the storefront is unaffected** — only image search fails.

**Reindex path** (`lib/reindex.ts:27-33`): the trigger is fire-and-forget and never awaited. If the server is unreachable, the `.catch` just logs a `console.warn`. **The product create/edit/delete still succeeds.** Consequence: the index silently goes stale — the new product won't be searchable until a later successful reindex or a manual `python generate_embeddings.py`. There is **no retry, no queue, no backfill** — this is exactly why the live index has 16 products while the seed CSV has 45.

### 3.3 When a new product is added, what does NOT update automatically?

Confirmed by reading `app/api/products/route.ts` and `lib/reindex.ts`:
- The visual-search reindex **is** triggered (`route.ts:91`), **but only as best-effort, non-blocking fire-and-forget.** If the Python server is down (or the reindex throws), the embedding index does **not** update and nothing retries it. So in practice, embeddings do **not** reliably auto-rebuild — your suspicion is correct.
- The **`imageVector` DB column is never written** under any circumstance.
- The reindex is also *incremental and image-keyed*: it only re-encodes products whose `image` value changed (`indexer.py:122-132`). Metadata-only edits reuse the cached vector — correct, but means a product can be in the DB yet absent from search if its reindex never ran.
- `rating`/`reviewCount` are unrelated to product creation; they only update via the reviews API.

**The honest one-sentence answer:** "Adding a product triggers a non-blocking reindex request to the Python service; if that service isn't running the product is saved anyway and is simply not searchable until the index is rebuilt — there's no automatic retry, and the pgvector column is never touched."

---

## 4. EXAMINER-BAIT WEAK POINTS (be honest)

1. **No evaluation methodology for the visual search — at all.** There is no test set, no labeled ground truth, no precision/recall/recall@k/mAP, no confusion analysis, nothing. `TOP_K=3` and `SIMILARITY_THRESHOLD=0.55` are hand-chosen constants; the code comment literally calls 0.55 "a good starting point" (main.py:54). **This is your biggest academic exposure.** An examiner asking "how do you know it works / how did you pick 0.55 / what's your accuracy" has no answer in the code. Pre-empt it: be ready to say what an evaluation *would* look like (a labeled query set, measure precision@1 and recall@3, sweep the threshold on a held-out set) and acknowledge it as future work.

2. **Linear-scan cosine similarity on a pickle — where it actually breaks.** The search is `np.dot((N,512), (512,))` = O(N·D), recomputed per query, full scan, no ANN index. **At the current N=16 this is microseconds — performance is a non-issue at demo scale.** The honest framing: the weakness is *architectural, not performance-at-current-N*. Rough breakpoints:
   - Compute stays trivial to ~10^5–10^6 vectors (1M×512 float32 dot ≈ 0.5 GFLOP, tens of ms on CPU).
   - The real walls hit earlier and for other reasons: the **entire matrix must fit in one process's RAM** (1M×512×4B ≈ 2 GB), the server is **single-process** so every query is serialized through the GIL/CPU, and **every reindex re-downloads/re-encodes changed images** (CLIP inference, the slow part) and rewrites the whole pickle. So it "breaks" operationally (rebuild time, memory, single point of failure, no concurrency) long before dot-product latency matters — call it low-tens-of-thousands of products before you'd want a real vector store.

3. **Pickle instead of a vector DB — real costs.**
   - No ANN index → still linear (a vector DB like pgvector/FAISS/Qdrant gives sub-linear approximate search).
   - **Security: `pickle.load()` executes arbitrary code if the file is tampered with** (`indexer.py:175`). If an attacker can write `products.pkl`, they get RCE in the Python process. A vector DB has no such footgun.
   - No durability/transactions, no concurrent writers, must reload the *entire* file to refresh, not network-shared, single point of failure, doesn't scale horizontally.
   - The irony to own: **pgvector is already enabled in the DB** (and a column exists), so the "right" tool was provisioned and then not used.

4. **CLIP is general-purpose, not fine-tuned.** ViT-B/32 was never trained on your catalog. It captures visual/semantic similarity, not product identity, and is sensitive to background, lighting, crop, and angle. The comment claiming 0.55 "catches the same model/colour" (main.py:54-55) is optimistic, not validated. Expect: "Why CLIP and not a model trained on your products?" — answer: zero-shot generalization with no training data/labels, at the cost of precision.

5. **Security — what the model defends vs. doesn't.**
   - **Defends against:** password DB leakage (bcrypt, 10 rounds); cookie forgery/tampering (HS256 signature, algorithm pinned to block `alg:none` downgrade, secret required—no fallback); privilege escalation via registration (`role` forced to `USER`); IDOR on orders (`orders/route.ts:54`, `orders/[id]/route.ts:120` check ownership/admin); client price/total tampering (server recomputes from DB in a transaction); overselling (atomic conditional stock decrement); open-redirect on login (`getSafeRedirect()` rejects `//` and `/\`).
   - **Does NOT defend against:**
     - **XSS token theft** — `auth_session` is `httpOnly:false`, so any injected script can read the JWT and impersonate the user for up to 7 days. This is the headline auth weakness.
     - **No server-side logout/revocation** — "logout" only clears the client cookie; a stolen token is valid until `exp`. No blacklist.
     - **No CSRF tokens** — state-changing POSTs rely solely on `SameSite=Lax` cookies. Lax blocks most cross-site POSTs but isn't a substitute for CSRF protection, and `secure` is off in dev.
     - **No rate limiting / brute-force protection / account lockout** on login — unlimited password guesses.
     - **No password complexity enforced server-side** (only a client meter on register).
     - **`next/image` allows any remote host** (`next.config.ts:7-10`, `hostname:"**"`) — the image optimizer can be abused as an open proxy / mild SSRF amplifier.
     - **Visual-search endpoint is unauthenticated and has no size limit** — large base64 payloads or a decompression-bomb image (PIL opens arbitrary uploads, `main.py:197`) are a DoS vector against the CPU-bound CLIP service.
   - Minor: `bcryptjs` is a pure-JS bcrypt (slower than native `bcrypt`, but functionally fine); the legacy plaintext fallback (`password.ts:27`) implies some accounts were once stored in plaintext.

6. **Stale / partial index (16 of 45).** Demonstrable gap: search only covers products that were successfully embedded during a reindex while the sidecar was running. Have the answer ready and, ideally, **run `python generate_embeddings.py` before the defense** so the index is complete.

7. **Hardcoded `localhost:8000` in the search proxy** (`visual-search/route.ts:22`) while `reindex.ts` uses an env var — inconsistent and undeployable as-is.

8. **Brand/name inconsistency.** App is "SnapBuy"; the FastAPI app is titled "NexaShop Visual Search" (`main.py:111`); older docs say "NovaMart." Cosmetic, but examiners notice sloppiness.

9. **`fs` npm package in dependencies** is the security-placeholder junk package — easy "why is this here?" gotcha.

10. **`CANCELLED` order status** is rendered in the UI (`app/admin/page.tsx`, `app/order-confirmation/page.tsx`) but the `PATCH` endpoint's valid set is only `PENDING/PROCESSING/SHIPPED/DELIVERED` (`orders/[id]/route.ts:25`) — you can display it but not set it through the API.

---

## 5. LIKELY QUESTIONS + ANSWERS (15, mixed TR/EN, visual-search-weighted)

**Q1 (TR). Görsel arama nasıl çalışıyor? Adım adım anlatın.**
Kullanıcı bir görsel yükler/çeker → tarayıcı base64 data URL üretir → `POST /api/visual-search` → Next.js bunu Python servisine (`localhost:8000/search`) iletir → Python görüntüyü CLIP ViT-B/32 ile 512 boyutlu, L2-normalize edilmiş bir vektöre dönüştürür → bellekteki ürün matrisiyle kosinüs benzerliği (nokta çarpımı) hesaplar → en yüksek 3 sonucu alır, 0.55 eşiğinin altındakileri eler → ürün id'leri Next.js'e döner → Next.js Postgres'ten tam ürün kayıtlarını çekip benzerlik skoruyla birlikte döndürür.

**Q2 (EN). Why is cosine similarity computed as a plain dot product?**
Because both the stored product embeddings and the query embedding are L2-normalized to unit length (`indexer.py:71`, `main.py:203`). For unit vectors, cosine similarity equals the dot product (cos θ = a·b / (‖a‖‖b‖) = a·b when ‖a‖=‖b‖=1). `np.dot(matrix, query)` (main.py:207) gives all N similarities in one vectorized operation.

**Q3 (EN). What exactly is ViT-B/32 and what does the "/32" mean?**
It's CLIP's image encoder: a Base-size Vision Transformer that divides the 224×224 input into 32×32-pixel patches ("/32"), embeds and self-attends over them, and outputs a single 512-dimensional semantic vector. Weights are `laion2b_s34b_b79k` (trained on LAION-2B). It's pre-trained and general-purpose — not fine-tuned on my catalog.

**Q4 (TR). 0.55 eşik değerini ve TOP_K=3'ü nasıl belirlediniz?**
Dürüst cevap: deneysel/elle ayarlandı, resmî bir değerlendirme setiyle optimize edilmedi. 0.55 alakasız kategorileri (ör. telefon ararken hoparlör) eleyip aynı/benzer ürünleri yakalayan makul bir başlangıç noktası. TOP_K=3 tamamen sunum tercihi. Gelecek çalışma olarak etiketli bir sorgu setiyle precision@1 ve recall@3 ölçüp eşiği taramak gerekir.

**Q5 (EN). How is the embedding index stored, and how big is it?**
A Python pickle (`embeddings/products.pkl`): a dict `product_id → {id, name, category, image, embedding}` where each embedding is a float32 (512,) unit vector. At startup it's stacked into an in-memory NumPy matrix (N, 512). Currently N=16, ~32 KB of vector data.

**Q6 (EN). Your schema has a pgvector `imageVector` column — do you use it?**
No. It's provisioned (the `vector` extension and an `imageVector vector(2048)` column exist via the init migration) but no code reads or writes it. All matching is pickle + NumPy in the Python service. I'm also aware the declared dimension is wrong — it's `vector(2048)` while ViT-B/32 outputs 512 — so it's vestigial, likely copied from an earlier ResNet design.

**Q7 (EN). Why pickle and not pgvector/FAISS? What's the cost?**
Simplicity: the model already runs in Python and NumPy gives exact cosine in one line, so for a small catalog it was the fastest thing to build. Costs: it's a linear scan with no ANN index, the whole file must be loaded into one process's RAM, there's no concurrency/durability, and `pickle.load` is an arbitrary-code-execution risk if the file is tampered with. The principled upgrade is pgvector (already enabled) or FAISS/Qdrant with an HNSW index.

**Q8 (EN). At what catalog size does the current approach break?**
Dot-product compute stays trivial to ~10^5–10^6 vectors (~ms on CPU). It breaks operationally first: single-process serialization, the full matrix must fit in RAM (~2 GB at 1M×512×4B), and every reindex re-runs CLIP on changed images and rewrites the whole pickle. Realistically I'd move to a vector DB in the low tens of thousands of products.

**Q9 (EN). What happens to search if the Python server is offline?**
`/api/visual-search` catches the connection failure and returns HTTP 503 with a "server not running" message; the UI shows an error banner. Nothing else on the site is affected. And product create/edit/delete still succeed because the reindex call is fire-and-forget — the index just goes stale until the next successful rebuild.

**Q10 (TR). Yeni bir ürün eklediğimde otomatik aranabilir olur mu?**
Sadece Python servisi o an çalışıyorsa. Ürün kaydı, servise bloklamayan (fire-and-forget) bir `/reindex` isteği tetikler; servis kapalıysa istek sessizce başarısız olur, ürün yine de kaydedilir ama indekse girmez ve yeniden deneme yoktur. Şu an canlı indekste 45 yerine 16 ürün olmasının sebebi tam da bu.

**Q11 (EN). How do you prevent a user from forging an admin session by editing the cookie?**
The cookie is a JWT signed with a server-only secret (HS256). Any edit to the payload invalidates the signature, so `getSession`/the proxy reject it. The algorithm is pinned to HS256 to block an `alg:none` downgrade, and the secret is required (no insecure fallback). The localStorage role is never trusted server-side.

**Q12 (EN). Your auth cookie is not httpOnly — isn't that a vulnerability?**
Yes, it's a real trade-off. It's readable by JS so client-side logout can clear it, but that means an XSS bug could steal the token, valid for up to 7 days since there's no server-side revocation. Integrity (forgery) is still protected by the signature; confidentiality against XSS is not. The correct hardening is httpOnly + a server-side logout/blacklist.

**Q13 (EN). How do you stop price tampering or overselling at checkout?**
The order POST ignores the client's prices and total, derives the user from the session, and runs one Prisma transaction: it re-reads DB prices, recomputes the total (+20% tax), then decrements stock with a conditional `updateMany(where:{stock>=qty})`. If a concurrent order drained stock, the update affects 0 rows and the whole transaction rolls back. Card data is never persisted — only the shipping JSON.

**Q14 (EN). Why three different authorization mechanisms?**
They cover different layers. The edge `proxy.ts` blocks `/admin/*` page loads early. The per-route `getSession`/`isAdmin` checks are the authoritative gate — they re-verify the signed cookie on every API call, so data is protected regardless of UI. The client-side redirects on `/dashboard`, `/profile`, `/checkout` are UX only; the APIs behind them are still session-guarded.

**Q15 (EN). Could two different products confuse the search, or the same product fail to match?**
Yes — CLIP measures visual/semantic similarity, not identity. Two similar phones can both score high; the same product on a cluttered background or odd lighting can fall below 0.55 and return nothing. That's an inherent property of using a general pre-trained encoder without catalog fine-tuning, and without an evaluation set I can't quantify the error rate — which is the main limitation I'd address next.

---

## 6. PRE-DEFENSE CHECKLIST (do these before the 22nd)

- [ ] **Rebuild the index** so it isn't 16/45: `cd visual-search-server && python main.py` running, then `python generate_embeddings.py` (or `POST /reindex`). Confirm `/health` shows `products_indexed` matching the DB.
- [ ] Have the sidecar **running during the live demo** (otherwise search returns 503 and reindex won't fire).
- [ ] Be ready to **own** the three honest gaps unprompted: (1) no evaluation methodology, (2) pgvector is dead/wrong-dimension, (3) index can go stale because reindex is best-effort.
- [ ] Know the magic numbers cold: **512-dim**, **N=16 (fix it)**, **TOP_K=3**, **threshold 0.55**, **HS256 / 7-day JWT**, **bcrypt 10 rounds**, **20% tax**.
- [ ] Optional cleanups that pre-empt cheap shots: remove the `fs` junk dependency; unify the "NexaShop" title in `main.py:111` to SnapBuy; make the search proxy URL configurable like `reindex.ts`.
