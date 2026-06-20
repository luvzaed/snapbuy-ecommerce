# SnapBuy — Technical Walkthrough

> **Purpose.** This is an accurate, code-derived reference for the SnapBuy project, written to support thesis editing. Everything below was verified by reading the current source — not from any prior documentation. Where the real implementation differs from claims in older docs (which described a previous version called *NovaMart*), the discrepancy is called out explicitly. A dedicated **"Inconsistencies & things to double-check"** section at the end collects everything surprising.
>
> SnapBuy is a full-stack e-commerce storefront with an admin panel and an AI-powered visual ("search by image") feature. The UI language is Turkish.

---

## 1. Tech stack (verified from code & config)

| Concern | What's actually used | Where confirmed |
|---|---|---|
| **Framework** | **Next.js `^16.2.1`** (App Router, React Server + Client Components) | `package.json`, `app/` directory |
| **UI runtime** | **React `19.2.3`** / `react-dom 19.2.3` | `package.json` |
| **Language** | **TypeScript `^5.9.3`** (`strict: true`, `moduleResolution: "bundler"`, path alias `@/* → ./*`) | `package.json`, `tsconfig.json` |
| **Styling** | **Tailwind CSS v4** via the `@tailwindcss/postcss` PostCSS plugin; global styles in `app/globals.css`. Dark mode via `next-themes`. | `package.json`, `postcss.config.mjs`, `components/ThemeProvider.tsx` |
| **ORM** | **Prisma `^7.5.0`** with the **driver-adapter** model: `@prisma/adapter-pg` wrapping a `pg` `Pool` (`@prisma/adapter-pg ^7.6.0`, `pg ^8.20.0`) | `lib/prisma.ts`, `package.json` |
| **Database** | **PostgreSQL hosted on Supabase** (connection string points at `aws-1-eu-central-1.pooler.supabase.com:5432`, Supabase connection pooler). The **`vector` (pgvector) extension is enabled** in the schema. | `.env` (`DATABASE_URL`), `prisma/schema.prisma`, `prisma/migrations/.../migration.sql` |
| **Authentication** | **Custom auth** — passwords hashed with **`bcryptjs`** (10 salt rounds); sessions are **signed JWTs** (`jsonwebtoken`, **HS256**, 7-day expiry) stored in an **`auth_session` cookie**. **Not Supabase Auth.** | `lib/password.ts`, `lib/api-auth.ts`, `app/api/users/login/route.ts` |
| **Visual search** | **Python FastAPI** microservice running **OpenCLIP `ViT-B-32`** (`open_clip_torch`, pretrained `laion2b_s34b_b79k`) on PyTorch; embeddings persisted to a **pickle file** and held in memory; cosine similarity via **NumPy** | `visual-search-server/main.py`, `indexer.py`, `requirements.txt` |
| **Icons / UX** | `lucide-react`, `react-hot-toast` | `package.json` |

**Key clarifications vs. older docs:**

- **Auth is custom bcryptjs + signed JWT, NOT Supabase Auth.** Supabase is used *only as the Postgres host*. The app never calls a Supabase Auth SDK.
- **Visual-search embeddings are stored in a pickle file (`products.pkl`) and matched in-memory with NumPy — NOT in pgvector.** The pgvector extension and an `imageVector vector(2048)` column do exist in the database, but no code path reads or writes them (see §6 and the Inconsistencies section).

---

## 2. Project structure

Top-level layout (excluding `node_modules/`, `.venv/`, `.next/`):

```
my-app/
├── app/                      # Next.js App Router: pages + API routes
│   ├── layout.tsx            # Root layout: fonts, ThemeProvider, AuthProvider, Header/Footer, Toaster
│   ├── page.tsx              # Home page (storefront landing)
│   ├── globals.css           # Tailwind v4 global styles + custom utility classes
│   ├── not-found.tsx         # 404 page
│   ├── favicon.ico
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   ├── shop/                 # Product catalogue (search/filter/sort/paginate)
│   ├── product/[id]/         # Product detail (Server Component) + loading.tsx
│   ├── cart/                 # Shopping cart
│   ├── checkout/             # 3-step checkout (delivery → payment → review)
│   ├── order-confirmation/   # Post-order confirmation screen
│   ├── dashboard/            # Customer "my orders" page
│   ├── profile/              # Account settings (edit info, change password)
│   ├── admin/                # Admin panel (layout + overview + sub-pages)
│   │   ├── layout.tsx        # Admin shell (sidebar drawer); hides shell for non-admins
│   │   ├── page.tsx          # Admin overview/dashboard (stats, recent orders, top products)
│   │   ├── products/         # Product CRUD management
│   │   ├── orders/           # Order management (status updates)
│   │   └── users/            # User management
│   └── api/                  # Backend API route handlers (see §4)
│
├── components/               # Reusable client components
│   ├── Header.tsx            # Top nav (includes visual-search trigger, cart, auth links)
│   ├── Footer.tsx
│   ├── HeroCarousel.tsx, ProductMarquee.tsx, FeaturedCategories.tsx
│   ├── ProductCard.tsx, ProductActions.tsx, AddToCartButton.tsx
│   ├── ReviewSection.tsx     # Product reviews UI
│   ├── NewsletterSignup.tsx
│   ├── VisualSearch.tsx      # The AI image-search modal (upload/camera → results)
│   ├── FormInput.tsx
│   ├── ThemeProvider.tsx, ThemeToggle.tsx
│
├── lib/                      # Shared server/client logic
│   ├── prisma.ts             # Prisma client singleton (pg Pool + PrismaPg adapter)
│   ├── api-auth.ts           # JWT sign/verify (HS256), getSession(), isAdmin()
│   ├── password.ts           # bcryptjs hash/verify + legacy-plaintext fallback
│   ├── auth-context.tsx      # Client AuthProvider (user + cart + orders, localStorage)
│   ├── reindex.ts            # Fire-and-forget trigger to the Python /reindex endpoint
│   ├── types.ts              # Shared TypeScript types (Product, User, Order, CartItem…)
│   └── format.ts             # Price/number formatting helpers
│
├── prisma/
│   ├── schema.prisma         # Data model (User, Product, Order, OrderItem, Review, Newsletter)
│   └── migrations/           # 4 migrations (init + reviews + order shipping + product rating)
│
├── visual-search-server/     # Python AI microservice (FastAPI + OpenCLIP)
│   ├── main.py               # FastAPI app: /health, /search, /reindex
│   ├── indexer.py            # Shared indexing logic (DB → embeddings, pickle load/save)
│   ├── generate_embeddings.py# One-off full rebuild script
│   ├── embeddings/products.pkl  # Persisted embedding index (pickle)
│   └── requirements.txt
│
├── scripts/                  # Dev/ops utilities (ts-node / node)
│   ├── import-products.ts    # Seed products from data/products.csv into the DB
│   ├── check-users.ts        # Inspect users in the DB
│   ├── api-smoke-test.mjs    # API smoke test (referenced as "39 tests passing")
│   └── tsconfig.scripts.json
│
├── data/products.csv         # Seed product data
├── public/images/products/   # Admin-uploaded & seeded product images (served statically)
│
├── proxy.ts                  # Next.js 16 "proxy" (edge middleware) — protects /admin/*
├── next.config.ts            # next/image remote patterns (allow any host)
├── prisma.config.ts          # Prisma config (loads .env, points at schema)
├── package.json, tsconfig.json, eslint.config.mjs, postcss.config.mjs
├── .env                      # DATABASE_URL + JWT_SECRET (gitignored)
└── README.md                 # Default create-next-app boilerplate (not project-specific)
```

---

## 3. Pages and routes

All pages live under `app/`. Most are Client Components (`'use client'`); the product detail page is a Server Component that queries Prisma directly.

### Storefront

| Route | File | What it does |
|---|---|---|
| `/` | `app/page.tsx` | Home/landing. Fetches `/api/products` then renders `HeroCarousel`, `FeaturedCategories`, `ProductMarquee`, `NewsletterSignup`. Client Component. |
| `/shop` | `app/shop/page.tsx` | Product catalogue. Client-side search (by `?q=`), category filter (`?category=`), min/max price, sorting, and pagination (12/page). Wrapped in `<Suspense>` for `useSearchParams`. |
| `/product/[id]` | `app/product/[id]/page.tsx` | **Server Component** — loads the product with Prisma (`notFound()` if missing). Shows gallery, category-aware feature chips, `ProductActions` (add to cart / buy), and `ReviewSection`. Has a `loading.tsx` skeleton. |
| `/cart` | `app/cart/page.tsx` | Shopping cart backed by `auth-context` (localStorage). Quantity edits are stock-capped. |
| `/checkout` | `app/checkout/page.tsx` | 3-step flow: **Teslimat** (delivery/contact) → **Ödeme** (payment, card formatting only) → **İnceleme** (review). Submits the order via `auth-context.placeOrder()` → `POST /api/orders`. Card data is **not** persisted. |
| `/order-confirmation` | `app/order-confirmation/page.tsx` | Confirmation screen after a successful order. |
| `/dashboard` | `app/dashboard/page.tsx` | Customer "Siparişlerim" (my orders). Redirects to `/login` if not authenticated (client-side). Lists the user's orders with status badges. |
| `/profile` | `app/profile/page.tsx` | Account settings: edit name/email, change password (verifies current password). Calls `PUT /api/users/[id]`. |
| `/login` | `app/login/page.tsx` | Email/password login → `POST /api/users/login`. Honors a safe same-origin `?redirect=` target (open-redirect guard). |
| `/register` | `app/register/page.tsx` | Registration with live password-strength meter. On success, auto-logs-in by calling the login endpoint (so the `auth_session` cookie is set). |
| `*` | `app/not-found.tsx` | 404. |

### Admin (`/admin/*`)

`app/admin/layout.tsx` renders the admin shell (collapsible sidebar drawer) only when `user.role === 'admin'`; otherwise it renders children bare. Server-side protection for `/admin/*` is enforced by `proxy.ts` (see §5).

| Route | File | What it does |
|---|---|---|
| `/admin` | `app/admin/page.tsx` | Overview dashboard: stat cards (products, orders, revenue, users), recent orders, and "En Çok Satan Ürünler" (top products from `/api/admin/top-products`). |
| `/admin/products` | `app/admin/products/page.tsx` | Product management — create/edit/delete, including image upload (multipart). |
| `/admin/orders` | `app/admin/orders/page.tsx` | Order management — view all orders, change status. |
| `/admin/users` | `app/admin/users/page.tsx` | User management — list/edit/delete users, change roles. |

---

## 4. API routes

All under `app/api/`, implemented as App Router route handlers. Authentication is enforced server-side via `getSession(req)` / `isAdmin(session)` from `lib/api-auth.ts` (reads the signed `auth_session` cookie).

| Endpoint | Methods | Auth | Behaviour |
|---|---|---|---|
| `/api/products` | `GET` | public | List all products (newest first). |
| `/api/products` | `POST` | **admin** | Create a product. Accepts JSON or `multipart/form-data` (image file saved to `public/images/products/`). Requires name, price, image. Triggers a visual-search reindex (non-blocking). |
| `/api/products/[id]` | `GET` | public | Fetch one product (404 if missing). |
| `/api/products/[id]` | `PUT` | **admin** | Update a product (JSON or multipart). Deletes the old local image if replaced. Triggers reindex. |
| `/api/products/[id]` | `DELETE` | **admin** | Delete a product, best-effort delete its local image, trigger reindex. |
| `/api/users` | `GET` | **admin** | List users (no passwords; includes order counts). |
| `/api/users` | `POST` | public | **Registration.** Validates email, hashes password, always creates role `USER` (any `role` in the body is ignored). `409` on duplicate email. **Does not set a session cookie** — the client auto-logs-in afterward. |
| `/api/users/[id]` | `GET` | **admin** | Fetch one user. |
| `/api/users/[id]` | `PUT` | session | Update a user. Non-admins may edit only their own record and never their own role; self password change must verify the current password. Admins may edit anyone and change roles. Passwords always hashed. |
| `/api/users/[id]` | `DELETE` | **admin** | Delete a user. |
| `/api/users/login` | `POST` | public | Verify credentials (bcrypt, with legacy-plaintext fallback + lazy re-hash on success). On success: returns the user and **sets the signed `auth_session` JWT cookie**. |
| `/api/orders` | `GET` | session | `?userId=X` returns that user's orders (IDOR-guarded: must match session or be admin). `?all=true` returns all orders (admin only). |
| `/api/orders` | `POST` | session | Create an order. **User is taken from the session, never the body.** Runs in a single Prisma transaction: re-checks stock, recomputes total from real DB prices + **20% tax**, creates order + items, atomically decrements stock (conditional `updateMany` guards against overselling). |
| `/api/orders/[id]` | `GET` | session | Single order detail (owner or admin only — IDOR-guarded). |
| `/api/orders/[id]` | `PATCH` | **admin** | Update order status. Valid statuses: `PENDING, PROCESSING, SHIPPED, DELIVERED`. |
| `/api/orders/[id]` | `DELETE` | **admin** | Delete an order (deletes its `OrderItem`s first — no DB cascade). |
| `/api/reviews` | `GET` | public | Reviews for a product (`?productId=X`), newest first, with author info. |
| `/api/reviews` | `POST` | session | Create/update a review (upsert, one per user per product). Caller must match `userId`. Rating 1–5, comment required. Recomputes the product's denormalised `rating`/`reviewCount` cache (best-effort). |
| `/api/reviews/[id]` | `DELETE` | session | Delete a review (author or admin). Recomputes the product rating cache. |
| `/api/newsletter` | `POST` | public | Subscribe an email (validated, lowercased). `400` on duplicate. |
| `/api/admin/top-products` | `GET` | **admin** | Top 5 products by units sold, with revenue computed from stored order-item prices. |
| `/api/visual-search` | `POST` | public | Accepts a base64 image, **proxies it to the Python server at `http://localhost:8000/search`**, then hydrates the returned `product_id`s into full product records (preserving rank + similarity score). Returns `503` with a helpful message if the Python server is unreachable. |

---

## 5. Authentication flow

SnapBuy uses **custom authentication** — there is no third-party auth provider. Two layers cooperate:

1. **Server-authoritative session: a signed JWT cookie.**
2. **Client convenience state: a `shop_user` object in `localStorage`** (used only to render UI quickly; never trusted for authorization).

### Passwords (`lib/password.ts`)
- `hashPassword()` uses **bcryptjs** with `SALT_ROUNDS = 10`.
- `verifyPassword()` compares against a bcrypt hash, but **falls back to a direct plaintext compare** for legacy accounts created before hashing was introduced (`isHashed()` detects the `$2a$/$2b$/$2y$` prefix).
- On a successful login with a legacy plaintext password, the login route **lazily re-hashes** it (see below).

### Login (`app/api/users/login/route.ts`)
1. Look up the user by email.
2. `verifyPassword(password, user.password)`.
3. If the stored value wasn't hashed, upgrade it to a bcrypt hash (non-fatal if it fails).
4. Build `userData` with `role: user.role.toLowerCase()` (DB stores `USER`/`ADMIN`; the session uses lowercase `'user'`/`'admin'`).
5. **Sign a JWT** via `signSession({ id, role })` and set it as the `auth_session` cookie:
   - `httpOnly: false` (deliberately readable by JS so client logout can clear it),
   - `secure` in production, `sameSite: 'lax'`, `path: '/'`, `maxAge` 7 days.

### Session signing/verification (`lib/api-auth.ts`)
- `signSession()` — `jwt.sign({ id, role }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' })`.
- `getSession(req)` — reads `auth_session`, verifies with the **algorithm pinned to HS256** (prevents `alg: none` downgrade), validates payload shape, returns `{ id, role }` or `null`.
- `isAdmin(session)` — `session?.role === 'admin'`.
- `JWT_SECRET` is **required** — `getSecret()` throws if it's unset (no insecure fallback). The secret lives in `.env` (gitignored).

### Registration (`app/api/users/route.ts POST` + `app/register/page.tsx`)
- Public `POST /api/users` validates email, hashes the password, and **always assigns role `USER`** — any `role` field in the body is ignored, so registration can never mint an admin.
- This endpoint **does not set a cookie**. The register page therefore calls the login endpoint immediately after a successful signup ("auto-login") so the `auth_session` cookie gets set, then stores the returned user via `setAuthUser()`.

### Client auth state (`lib/auth-context.tsx`)
- `AuthProvider` hydrates `user` from `localStorage['shop_user']` and `cart` from `localStorage['shop_cart']` on mount, exposing `loading` until hydration completes.
- `setAuthUser()` writes the user to state + localStorage; `logout()` clears state, cart, and localStorage (the cookie is also non-`httpOnly` so it can be cleared client-side).
- Also owns cart logic (stock-capped `addToCart`, `updateQuantity`, `removeFromCart`) and `placeOrder()` / `fetchOrders()`.
- **Storefront protected pages** (`/dashboard`, `/profile`, checkout) guard themselves **client-side** by redirecting to `/login` when `!user` after `loading` resolves.

### Route protection — `proxy.ts` (Next.js 16 "proxy" / edge middleware)
- **Naming:** Next.js 16 renamed the `middleware` convention to **`proxy`**; the file must be `proxy.ts` at the project root and export a function named `proxy`. `config.matcher = ['/admin/:path*']`, so it runs **only on `/admin/*`**.
- **Why it re-implements JWT verification:** it runs on the **Edge runtime**, where `jsonwebtoken` (Node `crypto`) can't run. So `proxy.ts` verifies the **same HS256 signature using the Web Crypto API** (`crypto.subtle`), decoding base64url manually. Same secret (`JWT_SECRET`), same algorithm as `lib/api-auth.ts`.
- **Logic:**
  - Read `auth_session`. Verify signature, algorithm (`HS256`), expiry (`exp`), and payload shape.
  - If invalid/missing/expired → delete the cookie and redirect to `/login?redirect=<path>`.
  - If valid but `role !== 'admin'` → redirect to `/`.
- **Important:** because the role is checked as the lowercase string `'admin'`, and the login route lowercases the DB enum before signing, the two are consistent. (The DB stores `ADMIN`; the JWT carries `admin`.)

**Authorization summary:** API routes are the real enforcement point (`getSession`/`isAdmin` on every protected handler, plus IDOR guards on orders). `proxy.ts` adds an edge gate for the `/admin/*` UI. The client `localStorage` user is only for rendering and never trusted by the server.

---

## 6. AI visual search

This is the project's headline feature: "search for products by uploading a photo or using the camera."

### Components
- **Frontend:** `components/VisualSearch.tsx` — a modal (rendered via a React portal) with two tabs: **Görsel Yükle** (upload/drag-drop) and **Canlı Kamera** (live camera capture via `getUserMedia` → canvas → JPEG data URL). The chosen image becomes a base64 data URL.
- **Next.js API proxy:** `app/api/visual-search/route.ts`.
- **Python microservice:** `visual-search-server/` (FastAPI), default `http://localhost:8000`.

### The model
- **OpenCLIP `ViT-B-32`**, pretrained weights **`laion2b_s34b_b79k`** (`open_clip_torch==2.30.0`), on PyTorch. Runs on CUDA if available, else CPU. Loaded once at server startup (`main.py`).

### How embeddings are generated and stored — **pickle, not pgvector**
- `indexer.build_index()` reads `id, name, image, category` for every product **directly from the same Postgres/Supabase database** (`SELECT id, name, image, category FROM "Product"` via `psycopg2`, using `DATABASE_URL` from `../.env`).
- For each product it loads the image — **remote URLs are downloaded over HTTP; relative paths like `/images/products/x.jpg` are read from the Next.js `public/` folder** — and encodes it with CLIP into a **normalized** image embedding (`embed_image()`: `encode_image` → divide by L2 norm).
- The index is a Python dict `product_id → { id, name, category, image, embedding }`.
- It is **persisted to `visual-search-server/embeddings/products.pkl` (Python pickle)** via `save_index()`, and loaded back at startup via `load_index()`.
- At runtime the server keeps the index **in memory**: a `product_embeddings` dict, a parallel `product_ids` list, and a stacked NumPy `embedding_matrix`, all swapped together under a lock so a concurrent reindex can't corrupt an in-flight search.

> **This is the single biggest divergence from older docs.** Embeddings are **not** stored in pgvector and similarity is **not** computed by the database. The pgvector extension and the `Product.imageVector vector(2048)` column exist in the schema/migration, but **no code reads or writes them** — the whole search path is pickle + in-memory NumPy. (See Inconsistencies for the dimension mismatch.)

### How similarity is computed
- The query image is decoded from base64, CLIP-encoded, and L2-normalized (`main.py /search`).
- Because both query and stored embeddings are unit-normalized, **cosine similarity reduces to a dot product**: `similarities = np.dot(embedding_matrix, query_embedding)`.
- Top results are taken with `np.argsort(...)[::-1][:TOP_K]`, `TOP_K = 3`.
- A **`SIMILARITY_THRESHOLD = 0.55`** filters out weak matches; surviving scores are returned as percentages (`round(score * 100, 1)`).
- If nothing clears the threshold, an empty list is returned and the frontend shows a Turkish "no match" message.

### Request flow (frontend → Next.js → Python → back)
1. **Browser:** user uploads/captures an image in `VisualSearch.tsx` → base64 data URL → `POST /api/visual-search` with `{ image }`.
2. **Next.js route** (`app/api/visual-search/route.ts`): forwards `{ image }` to `POST http://localhost:8000/search`.
3. **Python `/search`:** decodes the image, embeds it, computes cosine similarities against the in-memory matrix, applies the threshold, returns `{ results: [{ product_id, similarity, name, category }] }`.
4. **Next.js route:** takes the returned `product_id`s, loads full product rows from Postgres via Prisma (`findMany({ where: { id: { in } } })`), merges in the similarity score, preserves rank order, and returns `{ products: [...] }`.
5. **Browser:** renders the matched products with a "%NN eşleşme" (match %) badge, each linking to `/product/[id]`.

### Keeping the index fresh
- The Python server exposes **`POST /reindex`** (incremental: reuses cached embeddings for products whose image URL hasn't changed; drops deleted products) and **`GET /health`**.
- The Next.js admin product API (`POST/PUT/DELETE /api/products[/id]`) calls **`lib/reindex.ts → triggerVisualSearchReindex()`**, a **fire-and-forget** `POST /reindex` (`VISUAL_SEARCH_URL`, default `http://localhost:8000`). It never blocks or fails the product mutation — if the Python server is down, the product still saves and the index catches up later.
- `generate_embeddings.py` is a one-off full rebuild script for a cold start.

---

## 7. Database schema (Prisma)

Defined in `prisma/schema.prisma`. Provider `postgresql`; `previewFeatures = ["postgresqlExtensions"]`; `extensions = [vector]` (pgvector). One enum: `Role { USER, ADMIN }`.

### Models & relationships

- **`User`** — `id`, `email` (unique), `name?`, `password` (bcrypt hash), `phone?`, `address?`, `role` (`Role`, default `USER`), timestamps.
  - `User 1—* Order`
  - `User 1—* Review`

- **`Product`** — `id`, `name`, `price`, `stock` (default 0), `image`, `description`, `category` (default `"General"`), `rating?`, `reviewCount` (default 0), **`imageVector Unsupported("vector(2048)")?`**, timestamps.
  - `Product 1—* OrderItem`
  - `Product 1—* Review`
  - `rating`/`reviewCount` are a **denormalised cache** kept in sync by the reviews API.

- **`Order`** — `id`, `total`, `status` (string, default `"PENDING"`), **`shipping Json?`** (delivery/contact snapshot captured at checkout — no card data), `userId`, timestamps.
  - `Order *—1 User`
  - `Order 1—* OrderItem`

- **`OrderItem`** — `id`, `quantity`, `price` (the price *at time of order*), `orderId`, `productId`.
  - `OrderItem *—1 Order`, `OrderItem *—1 Product`
  - No cascade delete (the order DELETE route removes items first).

- **`Review`** — `id`, `rating` (Int), `comment?`, `userId`, `productId`, timestamps. **`@@unique([userId, productId])`** → one review per user per product (enforced via `upsert`).
  - `Review *—1 User`, `Review *—1 Product`

- **`Newsletter`** — `id`, `email` (unique), `createdAt`.

### Migrations
`prisma/migrations/` contains four, in order:
1. `..._init_snapbuy_schema` — creates the schema, the `vector` extension, and the `imageVector vector(2048)` column.
2. `..._add_review_model` — adds `Review`.
3. `..._add_order_shipping` — adds `Order.shipping`.
4. `..._add_product_rating_fields` — adds `Product.rating` / `reviewCount`.

---

## 8. Inconsistencies & things to double-check

These are points where the code surprised me or contradicts older documentation. Verify each against your thesis before relying on it.

1. **pgvector exists but is unused (biggest one).** The DB has the `vector` extension and a `Product.imageVector vector(2048)` column (created by the init migration), but **no code path reads or writes it**. All visual-search storage/matching happens in the Python service via **pickle + in-memory NumPy**. If your thesis claims "embeddings are stored in pgvector and similarity is computed in Postgres," that is **not** what the code does. The accurate statement: *embeddings are persisted to a pickle file and matched in-memory with NumPy cosine similarity; pgvector is provisioned but not wired up.*

2. **Vector dimension mismatch.** `imageVector` is declared `vector(2048)`, but **OpenCLIP `ViT-B-32` produces 512-dimensional embeddings**. So even if pgvector were used, the column width would be wrong. This strongly suggests the column is vestigial (possibly copied from an earlier ResNet-style 2048-dim design).

3. **Stale product/brand names in code.** The app brand is **SnapBuy** (`app/layout.tsx`, admin sidebar), but the Python FastAPI app is titled **"NexaShop Visual Search"** (`main.py`), and several Python comments refer generically to "Supabase." Older docs called the project **NovaMart**. So at least three names appear across the project: SnapBuy (current/correct), NexaShop (Python title), NovaMart (old docs). Worth unifying for the thesis.

4. **The `auth_session` cookie is `httpOnly: false`.** This is intentional (so client-side logout can clear it), and integrity is protected by the HS256 signature, but it means the JWT is **readable by JavaScript** and therefore exposed to XSS-based token theft. Flag this if your thesis discusses session security.

5. **Two parallel "session" notions.** Authorization is enforced by the **signed JWT cookie** (server + edge proxy). Separately, the client keeps an **unsigned `shop_user` in `localStorage`** used purely to render UI (e.g. the admin layout shows its shell when `localStorage` says `role === 'admin'`). The localStorage copy is *not* trusted by the server, but it can momentarily show admin chrome to a tampered client before the API/proxy reject the actual requests. Describe these as two layers, not one.

6. **Storefront protected pages rely on client-side redirects only.** `proxy.ts` guards `/admin/*` at the edge, but `/dashboard`, `/profile`, and checkout protect themselves only with client-side `useEffect` redirects. The underlying APIs are still session-guarded, so data isn't exposed — but the pages themselves are not edge-protected.

7. **Order status set vs. UI.** The order `PATCH` endpoint only accepts `PENDING, PROCESSING, SHIPPED, DELIVERED`, but the admin overview and customer dashboard include a **`CANCELLED`** status mapping. `CANCELLED` is rendered if present but can't be set through the documented endpoint — check whether that's intended.

8. **Review comment required in API, optional in schema.** `Review.comment` is `String?` (nullable) in Prisma, but `POST /api/reviews` **rejects an empty comment**. So in practice every review has a comment, despite the schema allowing none.

9. **Legacy plaintext-password fallback.** `verifyPassword()` still accepts a direct plaintext match for un-hashed accounts (then lazily re-hashes on login). Fine as a migration path, but note it for a security discussion — it implies some accounts may have been stored in plaintext historically.

10. **`README.md` is boilerplate.** It's the default `create-next-app` README (even references "Geist" font, though the app actually uses **Inter** via `next/font`). Don't cite it as project documentation.

11. **Both `/search` (Python) and `/api/visual-search` (Next.js) return product metadata, but the UI uses the Next.js-hydrated copy.** The Python `SearchResult` includes `name`/`category`, yet the Next.js route re-fetches full product rows from Prisma and ignores the Python-provided name/category. Not a bug, just redundant — worth a sentence if you describe the data flow precisely.
