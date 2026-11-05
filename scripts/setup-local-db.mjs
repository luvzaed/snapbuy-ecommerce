import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import { prepareLocalEnv } from './local-env.mjs';

const settings = JSON.parse(fs.readFileSync('.local/settings.json', 'utf8'));
if (settings.port !== 55432 || settings.database !== 'snapbuy_local') throw new Error('Unexpected local database settings.');
const connection = { host: '127.0.0.1', port: settings.port, connectionTimeoutMillis: 5000,
  query_timeout: 20000, statement_timeout: 20000, lock_timeout: 5000 };
const databaseUrl = `postgresql://snapbuy_app:${settings.appPassword}@127.0.0.1:55432/snapbuy_local?schema=public`;
const owner = new Client({ ...connection, user: 'snapbuy_owner', password: settings.ownerPassword, database: 'postgres' });
console.log('Connecting to local PostgreSQL (maximum 5 seconds)...');
await owner.connect();
try {
  const role = await owner.query("SELECT 1 FROM pg_roles WHERE rolname = 'snapbuy_app'");
  if (!role.rowCount) {
    // PostgreSQL utility statements do not accept bind parameters for passwords.
    if (!/^[a-f0-9]{64}$/.test(settings.appPassword)) throw new Error('Invalid generated password.');
    await owner.query(`CREATE ROLE snapbuy_app LOGIN PASSWORD '${settings.appPassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
  }
  const db = await owner.query('SELECT 1 FROM pg_database WHERE datname = $1', [settings.database]);
  if (!db.rowCount) await owner.query('CREATE DATABASE snapbuy_local OWNER snapbuy_app');
} finally { await owner.end(); }
const extensionClient = new Client({ ...connection, user: 'snapbuy_owner', password: settings.ownerPassword, database: settings.database });
await extensionClient.connect();
try { await extensionClient.query('CREATE EXTENSION IF NOT EXISTS vector'); }
finally { await extensionClient.end(); }

const existingEnv = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const envText = prepareLocalEnv(existingEnv, {
  DATABASE_URL: databaseUrl,
  JWT_SECRET: settings.jwtSecret,
  VISUAL_SEARCH_URL: 'http://127.0.0.1:8000',
  VISUAL_SEARCH_REINDEX_TOKEN: settings.reindexToken,
  VISUAL_SEARCH_BIND_HOST: '127.0.0.1',
});
if (envText !== existingEnv) fs.writeFileSync('.env', envText);
for (const args of [['migrate', 'deploy'], ['generate']]) {
  console.log(`Running Prisma ${args.join(' ')} (maximum 2 minutes)...`);
  const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', ...args], {
    stdio: 'inherit', timeout: 120000, env: { ...process.env, DATABASE_URL: databaseUrl }
  });
  if (result.error?.code === 'ETIMEDOUT') throw new Error(`Prisma ${args[0]} exceeded 2 minutes. Local database setup stopped.`);
  if (result.status !== 0) throw new Error(`Prisma ${args[0]} failed.`);
}
const app = new Client({ ...connection, user: 'snapbuy_app', password: settings.appPassword, database: settings.database });
await app.connect();
try {
  const email = 'admin@snapbuy.local';
  const existing = await app.query('SELECT id FROM "User" WHERE email = $1', [email]);
  if (fs.existsSync('.local/import-report.json')) {
    fs.writeFileSync('.local/LOGIN.txt', 'Existing records have been retained. Sign in with your original website account and password.\n');
  } else if (!existing.rowCount) {
    await app.query('INSERT INTO "User" (email, name, password, role, "updatedAt") VALUES ($1, $2, $3, $4, NOW())',
      [email, 'Local administrator', await bcrypt.hash(settings.adminPassword, 12), 'ADMIN']);
    fs.writeFileSync('.local/LOGIN.txt', `Local Snapbuy administrator\nEmail: ${email}\nPassword: ${settings.adminPassword}\n\nChange the password in your profile after signing in. This login only applies to this local copy.\n`);
  }
  const counts = await app.query('SELECT (SELECT COUNT(*) FROM "Product") AS products, (SELECT COUNT(*) FROM "User") AS users');
  console.log('Local PostgreSQL is ready:', counts.rows[0]);
} finally { await app.end(); }
