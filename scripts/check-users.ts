import 'dotenv/config';
import { Pool } from 'pg';

async function checkUsers() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const result = await pool.query('SELECT id, email, name, role, password FROM "User"');
  console.log('Users in database:');
  console.log(JSON.stringify(result.rows, null, 2));
  await pool.end();
}

checkUsers().catch(console.error);
