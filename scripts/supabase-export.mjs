import { Client } from 'pg';

const quote = value => '"' + value.replaceAll('"', '""') + '"';
const transient = error => ['ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE', '08006', '57P01', '57P02', '57P03', '53300'].includes(error.code)
  || /connection terminated|connection timeout|timeout expired/i.test(error.message);

// No local writes occur here. Each retry starts an entirely new read-only snapshot.
export async function exportSnapshot(config, layout, {
  ClientClass = Client, progress = console.log,
  delay = ms => new Promise(resolve => setTimeout(resolve, ms)),
} = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const client = new ClientClass(config);
    let connectionError, connected = false;
    // pg emits idle connection failures as events rather than rejected queries.
    client.on('error', error => { connectionError = error; });
    const query = async (sql, values) => {
      if (connectionError) throw connectionError;
      const result = await client.query(sql, values);
      if (connectionError) throw connectionError;
      return result;
    };
    try {
      progress(`Connecting to Supabase securely (attempt ${attempt}/3)...`);
      await client.connect(); connected = true;
      await query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
      await query("SET LOCAL TIME ZONE 'UTC'");
      const sourceTables = (await query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")).rows.map(row => row.tablename);
      if (sourceTables.some(table => !(table in layout) && table !== '_prisma_migrations')) throw new Error('SOURCE_EXTRA_TABLES');
      const exported = {};
      for (const [table, cols] of Object.entries(layout)) {
        progress(`Reading Supabase ${table}...`);
        const sourceCols = (await query('SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position', ['public', table])).rows.map(row => row.column_name);
        if (!sourceCols.length && table !== 'Newsletter') throw new Error('SOURCE_MISSING_TABLE');
        if (sourceCols.length && (sourceCols.length !== cols.length || sourceCols.some(col => !cols.includes(col)))) throw new Error('SCHEMA_MISMATCH');
        exported[table] = sourceCols.length ? (await query(`SELECT ${cols.map(col => `${quote(col)}::text AS ${quote(col)}`).join(', ')} FROM public.${quote(table)} ORDER BY id`)).rows : [];
        progress(`Read ${table}: ${exported[table].length} records`);
      }
      await query('ROLLBACK');
      return exported;
    } catch (error) {
      if (attempt === 3 || !transient(error)) {
        error.databaseEndpoint = 'Supabase';
        throw error;
      }
      progress('Supabase connection dropped. Discarding the incomplete snapshot and retrying; local records have not been changed.');
    } finally {
      // Closing also rolls back a source snapshot left open by a failed read.
      if (connected || connectionError) await client.end().catch(() => {});
    }
    await delay(attempt * 1000);
  }
}
