# Snapbuy on your computer

Snapbuy uses Prisma and a PostgreSQL database on your own computer.

## Requirements

- Node.js 24.
- PostgreSQL 18 with the pgvector extension installed. The Windows launcher expects its tools under `C:\Program Files\PostgreSQL\18\bin`.
- Python and the dependencies in `visual-search-server/requirements.txt` if you want image search.

## Start the website

Open the project folder in VS Code or PowerShell. On first setup, install the JavaScript dependencies while online:

```powershell
npm ci
```

Start the website:

```powershell
npm run dev
```

The startup script checks whether PostgreSQL accepts local connections. It starts the database when needed, waits for recovery, applies pending migrations and generates Prisma's client. It does not reset an existing database.

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) after the terminal reports that the website is ready. `Start-Snapbuy.cmd` is an alternative launcher.

A fresh installation starts with an administrator and an empty catalogue. Read `.local/LOGIN.txt` for login instructions, then add products through the admin pages. Existing installations retain their own accounts and records.

Keep the website terminal open. Ctrl+C stops the website. Use `Stop-Database.cmd` to stop PostgreSQL cleanly. No automatic Windows service is installed.

## Visual search

Keep the website running, then open a second terminal in the project folder:

```powershell
cd visual-search-server
python -m pip install -r requirements.txt
python generate_embeddings.py
python main.py
```

Install dependencies once. Generate the index on first setup or when replacing a legacy index. For later sessions, run `python main.py`.

The service uses FastAPI and OpenCLIP and listens on `127.0.0.1:8000`. Its first model download requires internet. Model weights and dependencies must be cached before offline use.

Open [the health check](http://127.0.0.1:8000/health) and confirm that `products_indexed` is greater than zero. [The API documentation](http://127.0.0.1:8000/docs) lists its endpoints. Use the storefront image-search icon to upload a product photo and view matches.

The current index format is `embeddings/products.json`. Old `.pkl` files are not loaded; regenerate the index rather than trying to restore a pickle file.

## Private data and backups

- PostgreSQL listens on `127.0.0.1:55432`; the application database is `snapbuy_local`.
- The app uses a separate PostgreSQL account without superuser privileges.
- The launcher maintains an ignored `.env`. Next.js and the Python indexer share its local database configuration.
- Database files, private settings and login instructions are in `.local/`. Preserve this folder and `.env` when moving an existing installation.
- Stop the website and database before moving their files. Do not delete `.local/` to troubleshoot startup.
- Private records and backups are not published with the repository. The completed Supabase migration utilities were removed; previous versions remain in Git history.
- Make consistent backups with PostgreSQL's `pg_dump`, or stop PostgreSQL cleanly before copying the complete `.local/postgres` directory. Copying a running database directory is not a reliable backup.

## Verify and troubleshoot

```powershell
npm test
npm run lint
```

With the website running, use a second terminal for `npm run db:test`, or use `Test-Snapbuy.cmd`. The integration checks use temporary accounts and records and clean up their fixtures.

Startup details are saved in `.local/postgres-start.log`, `.local/postgres-start-error.log` and `.local/postgres.log`. Opening the website before the server is ready produces a connection-refused error.

The core website, database, local fonts and local product images can work offline. Remote image URLs need internet. See [SECURITY.md](SECURITY.md) for the security controls and limitations.
