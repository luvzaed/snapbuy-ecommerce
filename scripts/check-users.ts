import 'dotenv/config';
import { Pool } from 'pg';

async function checkUsers() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const result = await pool.query('SELECT role, COUNT(*)::int AS count FROM "User" GROUP BY role');
  console.log('Account totals by role (no personal details or password hashes):');
  console.log(JSON.stringify(result.rows, null, 2));
  await pool.end();
}

checkUsers().catch(console.error);
