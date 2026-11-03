# Snapbuy

A full-stack e-commerce demo built with **Next.js, TypeScript, Prisma and PostgreSQL**, with a Turkish storefront, an admin panel and optional image-based product search.

This edition runs with a database on your own computer. Checkout creates demo orders without collecting card details or processing payments.

## Screenshots

### Storefront

![Snapbuy homepage featured product carousel](docs/screenshots/home.jpg)

### Product catalogue

![Product catalogue with search, category filters and sorting](docs/screenshots/shop.jpg)

### Product details

![Product details with pricing, stock and shopping controls](docs/screenshots/product.jpg)

## Features

- Product browsing, text search, category and price filters, sorting and pagination.
- Product details, customer reviews and a shopping cart with quantity controls.
- Account registration, login, profile settings and customer order history.
- Demo checkout with server-side price and stock validation.
- Admin pages for products, orders and users, protected by server-side role checks.
- Light and dark themes.
- Optional visual search using a Python FastAPI service and OpenCLIP image embeddings.

## Tech stack

| Area | Technology |
| --- | --- |
| Web application | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS, next-themes, Lucide icons |
| Data | PostgreSQL, Prisma, pg |
| Authentication | bcrypt password hashes, signed JWTs in HttpOnly cookies |
| Optional visual search | Python, FastAPI, PyTorch, OpenCLIP, NumPy |
| Checks | Node.js tests, ESLint, GitHub Actions, database integration checks |

## Run locally on Windows

Install **Node.js 24** and **PostgreSQL 18 with pgvector**. Clone the repository, open its folder, then run:

```powershell
npm ci
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Startup prepares the local database on `127.0.0.1:55432`, applies migrations and generates the Prisma client. `Start-Snapbuy.cmd` is an alternative launcher.

A fresh clone starts with an empty catalogue. Product image files alone do not create database records. Use the admin product pages to add products, or import your own export as described below. Initial login instructions are generated in `.local/LOGIN.txt`.

Database files, private settings, passwords and logs stay in the ignored `.local/` directory and `.env`. Preserve them when moving an existing installation. Stop the website and use `Stop-Database.cmd` before moving the project.

For detailed setup, see [OFFLINE-SETUP.md](OFFLINE-SETUP.md).

## Import an existing Supabase database

Run the complete read-only [EXPORT-SNAPBUY.sql](EXPORT-SNAPBUY.sql) in Supabase SQL Editor, then download all six result rows using **Export → Download CSV**. Keep the export private and import it with:

```powershell
npm run db:import:file -- "C:\path\to\snapbuy-export.csv"
```

The importer creates a local backup, preserves IDs and relationships, verifies copied records and refuses to overwrite existing application data. The export only reads Supabase; it does not delete or cancel the hosted database. Private records and backups are excluded from this repository.

## Optional visual search and offline use

The Python service needs its dependencies installed and CLIP model weights cached before offline use. Inside `visual-search-server`, rebuild the JSON index and start the service:

```powershell
python generate_embeddings.py
python main.py
```

The service uses the local database configuration, binds to loopback and requires a generated token for reindexing. Legacy pickle indexes are never loaded. Existing local fonts and product images work offline; remote image URLs still require internet access and an approved `ALLOWED_IMAGE_HOSTS` setting.

## Validation

```powershell
npm test
npm run lint
```

With the website running, use a second terminal for:

```powershell
npm run db:test
```

The integration checks exercise temporary accounts, privacy, authorization and checkout, then clean up their fixtures. GitHub Actions builds and tests against a separate disposable PostgreSQL database.

For a production build on this computer:

```powershell
npm run db:setup
npm run build
npm start
```

## Security and project scope

This is a local e-commerce demonstration. It is not a production payment service. Authentication uses application accounts rather than Supabase Auth. Read [SECURITY.md](SECURITY.md) for the security controls, known limitations and requirements before internet hosting.
