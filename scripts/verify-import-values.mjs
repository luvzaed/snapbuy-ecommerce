const quote = value => '"' + value.replaceAll('"', '""') + '"';

// Compare values in PostgreSQL, rather than hashing its text formatting.
// Unconstrained base types are deliberate: timestamp(3) would hide precision loss.
export async function verifyImportValues(client, table, cols, expected, actualCount) {
  const mismatch = (reason, differences = []) => Object.assign(new Error('VERIFICATION_FAILED'), {
    verification: { table, reason, columns: differences, expectedCount: expected.length, actualCount },
  });
  if (actualCount !== expected.length) throw mismatch('row_count');
  if (!expected.length) return;
  const metadata = await client.query(`SELECT attname AS name, format_type(atttypid, NULL) AS type
    FROM pg_attribute WHERE attrelid = to_regclass($1) AND attnum > 0 AND NOT attisdropped`, [`public.${quote(table)}`]);
  const types = new Map(metadata.rows.map(row => [row.name, row.type]));
  if (cols.some(col => !types.has(col))) throw mismatch('schema');
  const checks = cols.map((col, index) => {
    const type = types.get(col);
    const lhs = type === 'json' ? `${quote(col)}::jsonb` : quote(col);
    const rhs = type === 'json' ? `$${index + 1}::json::jsonb` : `$${index + 1}::${type}`;
    return `CASE WHEN ${lhs} IS DISTINCT FROM ${rhs} THEN '${col.replaceAll("'", "''")}'::text END`;
  });
  const idIndex = cols.indexOf('id');
  if (idIndex === -1) throw mismatch('schema');
  const sql = `SELECT array_remove(ARRAY[${checks.join(', ')}], NULL) AS differences
    FROM public.${quote(table)} WHERE id = $${idIndex + 1}::integer`;
  for (const record of expected) {
    const result = await client.query(sql, cols.map(col => record[col]));
    if (result.rows.length !== 1) throw mismatch('missing_record');
    if (result.rows[0].differences.length) throw mismatch('value', result.rows[0].differences);
  }
}
