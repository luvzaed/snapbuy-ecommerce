import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Client } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { exportSnapshot } from './supabase-export.mjs';
import { readDashboardExport } from './read-dashboard-export.mjs';
import { verifyImportValues } from './verify-import-values.mjs';
import os from 'node:os';

const tables = ['User', 'Product', 'Order', 'OrderItem', 'Newsletter', 'Review'];
const quote = value => '"' + value.replaceAll('"', '""') + '"';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const settings = JSON.parse(fs.readFileSync('.local/settings.json', 'utf8'));
if (settings.port !== 55432 || settings.database !== 'snapbuy_local') throw new Error('Unexpected target database settings.');
const sourceFile = process.argv[2] || path.join(os.homedir(), 'snapbuy-security-test', '.env');
const dashboardFile = process.argv[2] === '--file' ? process.argv[3] : null;
if (sourceFile === '--file' && !dashboardFile) { console.error('Provide the downloaded CSV file path after --file.'); process.exit(1); }
let sourceConnection;
if (!dashboardFile) { try {
  sourceConnection = dotenv.parse(fs.readFileSync(sourceFile)).DATABASE_URL;
  const sourceUrl = new URL(sourceConnection);
  if (!/\.supabase\.(com|co)$/.test(sourceUrl.hostname)) throw new Error();
} catch {
  console.error('Cannot load a valid Supabase connection from the original project .env. Ask Codex to inspect the configuration without sharing passwords.');
  process.exit(1);
} }
const sourceConfig = { connectionString: sourceConnection, ssl: { rejectUnauthorized: true }, keepAlive: true, keepAliveInitialDelayMillis: 10000,
  connectionTimeoutMillis: 15000, query_timeout: 60000, statement_timeout: 60000, application_name: 'snapbuy_readonly_export' };
const target = new Client({ host: '127.0.0.1', port: 55432, database: 'snapbuy_local', user: 'snapbuy_app', password: settings.appPassword,
  connectionTimeoutMillis: 10000, query_timeout: 30000, statement_timeout: 30000, lock_timeout: 5000 });
let targetOpen = false, targetError;
target.on('error', error => { targetError = error; });
let phase = 'connecting to local PostgreSQL';
const reportFile = '.local/import-report.json';
const columns = async (client, table) => (await client.query(
  'SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position', ['public', table]
)).rows.map(row => row.column_name);
const read = async (client, table, cols) => (await client.query(
  `SELECT ${cols.map(col => `${quote(col)}::text AS ${quote(col)}`).join(', ')} FROM public.${quote(table)} ORDER BY id`
)).rows;
try {
  console.log('Checking the local database before exporting from Supabase...');
  await target.connect(); targetOpen = true;
  const layout = {};
  for (const table of tables) {
    layout[table] = await columns(target, table);
    if (!layout[table].length) throw new Error('LOCAL_SCHEMA_MISSING');
  }
  phase = dashboardFile ? 'validating the dashboard export file' : 'exporting the read-only Supabase snapshot';
  const exported = dashboardFile ? await readDashboardExport(dashboardFile, layout) : await exportSnapshot(sourceConfig, layout);
  console.log(dashboardFile ? 'Export file verified. No connection to Supabase was needed.' : 'Supabase export finished. Its connection is closed.');
  phase = 'checking the local database before import';
  if (targetError) { targetError.databaseEndpoint = 'local PostgreSQL'; throw targetError; }
  await target.query('BEGIN');
  await target.query("SET LOCAL TIME ZONE 'UTC'");
  // A running website must not add records while checking/importing the target.
  await target.query(`LOCK TABLE ${tables.map(table => `public.${quote(table)}`).join(', ')} IN ACCESS EXCLUSIVE MODE NOWAIT`);
  const originalTarget = {};
  for (const table of tables) {
    originalTarget[table] = await read(target, table, layout[table]);
  }
  const report = { importedAt: new Date().toISOString(), tables: Object.fromEntries(tables.map(table => [table, { count: exported[table].length, sha256: digest(exported[table]) }])) };
  // A completed, unchanged import is a safe no-op; new remote/local changes need review.
  const oldReport = fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, 'utf8')) : null;
  let alreadyImported = false;
  if (oldReport && tables.every(table => oldReport.tables[table]?.sha256 === report.tables[table].sha256)) {
    alreadyImported = true;
    for (const table of tables) {
      if (digest(originalTarget[table]) !== report.tables[table].sha256) {
        try { await verifyImportValues(target, table, layout[table], exported[table], originalTarget[table].length); }
        catch (error) { if (error.message !== 'VERIFICATION_FAILED') throw error; alreadyImported = false; break; }
      }
    }
  }
  if (alreadyImported) {
    console.log('These Supabase records are already imported and verified.');
    await target.query('ROLLBACK');
  } else {
    // Never merge over local purchases, profiles, or products automatically.
    const users = originalTarget.User;
    const hasLocalData = tables.filter(table => table !== 'User').some(table => originalTarget[table].length > 0);
    const bootstrapOnly = users.length === 1 && users[0].email === 'admin@snapbuy.local' && users[0].role === 'ADMIN' && await bcrypt.compare(settings.adminPassword, users[0].password);
    if (hasLocalData || (users.length && !bootstrapOnly)) throw new Error('LOCAL_RECORDS_EXIST');
    const backupDir = '.local/backups';
    fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replaceAll(':', '-');
    // Values are PostgreSQL text representations, preserving JSON nulls and timestamps.
    // Password hashes and contact details stay in ignored local files, never the log.
    fs.writeFileSync(path.join(backupDir, `supabase-${stamp}.json`), JSON.stringify({ format: 'snapbuy-postgres-text-v1', layout, records: exported }));
    fs.writeFileSync(path.join(backupDir, `local-before-import-${stamp}.json`), JSON.stringify({ format: 'snapbuy-postgres-text-v1', layout, records: originalTarget }));
    phase = 'importing into local PostgreSQL';
    if (bootstrapOnly) await target.query('DELETE FROM "User" WHERE id = $1', [users[0].id]);
    for (const table of tables) {
      console.log(`Importing ${table}: ${exported[table].length} records...`);
      const cols = layout[table];
      const sql = `INSERT INTO public.${quote(table)} (${cols.map(quote).join(', ')}) VALUES (${cols.map((_, index) => '$' + (index + 1)).join(', ')})`;
      for (const row of exported[table]) await target.query(sql, cols.map(col => row[col]));
      const actual = await read(target, table, cols);
      if (digest(actual) !== report.tables[table].sha256) {
        await verifyImportValues(target, table, cols, exported[table], actual.length);
      }
      await target.query("SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM " + quote(table) + "), 1), EXISTS(SELECT 1 FROM " + quote(table) + '))', [`public.${quote(table)}`]);
      console.log(`Verified ${table}: ${actual.length} records`);
    }
    await target.query('COMMIT');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log('Import completed. Original IDs, password values, and record relationships were preserved. Supabase was only read.');
    console.log('Sign in using your original website account. No generated administrator was added to the imported records.');
  }
} catch (error) {
  if (targetOpen && !targetError) await target.query('ROLLBACK').catch(() => {});
  const messages = {
    LOCAL_RECORDS_EXIST: 'The local database already contains user records. Import stopped to preserve them; Codex must review a merge or a separate target database.',
    SCHEMA_MISMATCH: 'The source and local table columns differ. Import stopped for review.',
    SOURCE_MISSING_TABLE: 'An expected source table is missing. Import stopped for review.',
    SOURCE_EXTRA_TABLES: 'Additional public source tables were found. Import stopped so they will not be silently left behind.',
    LOCAL_SCHEMA_MISSING: 'The local application tables are missing. Run npm run db:setup first.',
    INVALID_EXPORT_FILE: 'The export file is incomplete or differs from the expected dashboard export. No records were imported. Use EXPORT-SNAPBUY.sql and download all six result rows as CSV.',
    VERIFICATION_FAILED: 'Copied records did not match the source. The local import was rolled back.'
  };
  console.error(`Import stopped while ${phase}.`);
  if (error.databaseEndpoint) console.error(`Affected connection: ${error.databaseEndpoint}.`);
  console.error(messages[error.message] || `Connection/query error (${error.code || error.name}). Share this message with Codex; do not share passwords.`);
  if (error.verification) console.error(`Verification detail: ${error.verification.table}; ${error.verification.reason}; columns: ${error.verification.columns.join(', ') || '(none)'}.`);
  if (['SELF_SIGNED_CERT_IN_CHAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes(error.code)) {
    console.error('Certificate trust failed. Run npm run db:import to enable Windows certificate trust. If it still fails, download the project CA certificate from Supabase Database settings and save it as .local/supabase-ca.crt. Do not use a certificate copied from an unverified connection.');
  } else if (error.databaseEndpoint === 'Supabase') {
    console.error('Check that the Supabase project is active and the original connection settings are current. Do not disable certificate checks.');
  }
  fs.writeFileSync('.local/import-error.json', JSON.stringify({ phase, endpoint: error.databaseEndpoint || 'local PostgreSQL', code: error.code || error.name, verification: error.verification, time: new Date().toISOString() }, null, 2));
  process.exitCode = 1;
} finally {
  if (targetOpen || targetError) await target.end().catch(() => {});
}
