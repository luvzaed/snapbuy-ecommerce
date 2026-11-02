# Snapbuy on this computer

Snapbuy retains Prisma and uses PostgreSQL on this computer. Original Supabase settings remain in the original project folder and are never committed.

## Start

### Alternative: export through the Supabase dashboard

This route avoids a direct PostgreSQL connection to Supabase and its certificate problem:

1. Open `EXPORT-SNAPBUY.sql` from this folder and copy its entire contents.
2. In your Supabase project, open **SQL Editor**, create a new query, paste it, and run it. The query only reads the six application tables; it does not change them.
3. The result should contain six rows. Choose **Export → Download CSV** and save it as `snapbuy-export.csv`. Keep the file local and private because it contains account and order records.
4. In the terminal in this project folder, run `npm run db:import:file -- "C:\path\to\snapbuy-export.csv"`, using the real path to your download.
5. After the import completes, run `npm run dev` and sign in with your original website account.

The file importer checks the table list, columns, row counts and downloaded content checksums before using the same transaction and record verification as the direct importer. It refuses to overwrite existing local application records. It never runs downloaded SQL or contacts Supabase. Do not import an individual Product CSV with this command; it expects the complete six-row result from `EXPORT-SNAPBUY.sql`.

### Direct database import

From a terminal in this folder, stop any existing dev server with Ctrl+C, run `npm run db:import` once while connected to the internet, then run `npm run dev`. The import command prepares the local database and copies/verifies the Supabase records. `npm run dev` now prepares the local database before starting Next.js, so it cannot silently start without local database setup. If a command fails, stop and share its error; the setup/import log is saved to `.local/setup-output.log`.

The exporter uses a verified TLS connection and a read-only snapshot, closes Supabase before starting local record changes, and retries temporary connection failures at most three times. Each retry discards the partial snapshot and starts again. Connection errors are handled explicitly, with sanitized details in `.local/import-error.json`. If the source remains unreachable, check that your Supabase project is active and that the original `.env` has the current connection settings; do not share passwords or disable certificate verification.

The import launcher uses Node 24's `--use-system-ca` option so certificates already trusted by Windows are available to Node as well. If a certificate trust error persists, download your project's root CA certificate from Supabase's Database settings, save it as `.local/supabase-ca.crt`, and rerun the same import command. The launcher supplies that certificate only to the import process. Never disable TLS verification or trust a certificate retrieved from an unverified connection.

To copy your existing Supabase records first, double-click **Import-Supabase-and-Start.cmd** instead. Keep your internet connection on for that first import. It reads the connection from the original project's `.env`, creates private local backups, copies the six application tables in one transaction, and compares every copied record with the source. It preserves IDs, passwords and relationships. It only reads Supabase and refuses to import over existing local application records. It starts the website after a successful import. Use your original website login afterward. Later, use **Start-Snapbuy.cmd** for normal offline use.

If startup fails, the launcher pauses on the error. Share that error with Codex. PostgreSQL startup details are saved under `.local` in `postgres-start.log`, `postgres-start-error.log`, and (when the server starts) `postgres.log`. Opening localhost in a browser before the launcher has started the website will show “connection refused.”

1. Double-click **Start-Snapbuy.cmd** in this folder. The first run creates the database tables, generates Prisma's client, and creates a local administrator. Wait until the website reports that it is ready.
2. Open **http://localhost:3000** in your browser.
3. Find your generated local administrator email and password in **.local\LOGIN.txt**. Change the administrator password in the website after you finish the verification below.
4. With the website running, double-click **Test-Snapbuy.cmd**. It verifies registration, login, permissions, checkout validation, order totals, inventory, and logout against temporary local fixtures, including its own temporary administrator. It removes its test fixtures afterward and also works after a Supabase import.

Keep the website's terminal window open. Ctrl+C stops the website. **Stop-Database.cmd** shuts down PostgreSQL cleanly. Starting Snapbuy again starts the database again. No Windows service or automatic startup task is installed.

## Data and connection

- The database listens only on **127.0.0.1:55432**. Database name: **snapbuy_local**. The app uses a separate PostgreSQL account without superuser privileges.
- The launcher writes this copy's ignored `.env`; both Next.js and the Python indexer use its local `DATABASE_URL`.
- Database files and generated passwords are in **.local**. Keep this folder private and preserve it when moving the project. Never delete it to troubleshoot startup: it contains your local data.
- A new installation starts with an administrator and empty application tables. Existing records must be imported separately; customer records and backups are not included in the public repository. The original owner's local copy has already completed a verified import.
- The original Supabase project has not been changed or cancelled.

## Offline scope

The database and core website can run locally without Supabase. Google Fonts requests were removed and replaced with installed system fonts. Product images must be stored under `public` to be available offline; remote image URLs still require internet. This setup does not start the optional Python visual-search server. Its Python dependencies and CLIP model must be installed/cached before its first offline run.

## Verification status

Local PostgreSQL setup and the owner's data import completed and were verified by the importer. The owner confirmed the website works. Unit tests, lint and type checks cover the source changes; the GitHub Actions workflow builds and exercises authorization, privacy and checkout against a disposable database. Optional Python model-based search needs separate runtime validation. See the current pull-request checks for the exact tested revision and result.

The original migrations were retained. An additional migration creates Newsletter, which was present in Prisma's schema but missing from the migration history. The launcher uses `prisma migrate deploy` without resetting databases.

## Backups

Keep Supabase until its records are exported and the local copy is verified. Once you start entering local data, make regular PostgreSQL backups. Copying a running database directory is not a reliable backup; use PostgreSQL's `pg_dump`, or stop the server cleanly before copying the complete `.local\postgres` directory.
