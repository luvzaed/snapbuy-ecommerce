# Snapbuy: local PostgreSQL edition

This e-commerce demonstration uses Next.js, Prisma and PostgreSQL on your computer. It uses application bcrypt accounts, not Supabase Auth. The website binds to loopback and checkout creates demo orders without collecting cards or taking payments.

## Local Windows setup

Install Node.js 24 and PostgreSQL 18 with pgvector, then run `npm ci` once while online and `npm run dev`. Startup prepares a private database on `127.0.0.1:55432`, applies migrations, generates Prisma and writes an ignored `.env`. Open `http://127.0.0.1:3000`. The alternative launcher is `Start-Snapbuy.cmd`.

Database files, passwords, logs and login instructions are in `.local/`. Keep that folder private and preserve it when moving the project. Initial credentials are in `.local/LOGIN.txt`. A fresh clone starts empty: private customer records and backups are not published in this repository.

## Import and verify

Run the entire read-only `EXPORT-SNAPBUY.sql` in Supabase SQL Editor and download all six result rows with Export → Download CSV. Keep the file private. Run `npm run db:import:file -- "C:\path\to\snapbuy-export.csv"` from this project. The importer backs up locally, preserves IDs and relationships, verifies the records, and refuses to overwrite existing local application data. Use your original account after import. Supabase is only read, not cancelled.

`npm test` and `npm run lint` run local checks. With the website running, `npm run db:test` exercises temporary accounts, privacy, authorization and checkout and cleans up its fixtures. GitHub Actions builds and tests against a separate disposable PostgreSQL database with test-only credentials.

For a production build on this computer, run `npm run db:setup`, `npm run build`, then `npm start`. `Stop-Database.cmd` stops PostgreSQL. There is no automatic Windows service. See [OFFLINE-SETUP.md](OFFLINE-SETUP.md).

## Offline scope

Fonts and existing product-image files are local. Remote image URLs still require internet; `ALLOWED_IMAGE_HOSTS` controls approved HTTPS hosts for Next.js and Python. The optional Python service needs installed dependencies and cached CLIP weights before offline use. It reads the local `.env`, binds to loopback and protects reindex with a generated token. Rebuild its JSON index once with `python generate_embeddings.py`, then run `python main.py` inside `visual-search-server`. Legacy pickle files are never loaded.

This is a local demo, not a certified production payment service. Review [SECURITY.md](SECURITY.md) before internet hosting.

## Original scaffold references

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
