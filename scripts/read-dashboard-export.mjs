import fs from 'node:fs';
import { createHash } from 'node:crypto';
import csv from 'csv-parser';

// Parse a dashboard download as data only. Never execute SQL from an export file.
export async function readDashboardExport(filename, layout) {
  const rows = [];
  await new Promise((resolve, reject) => {
    const input = fs.createReadStream(filename);
    const parser = csv({ strict: true, maxRowBytes: 128 * 1024 * 1024,
      mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').trim() });
    input.on('error', reject);
    parser.on('error', reject).on('data', row => rows.push(row)).on('end', resolve);
    input.pipe(parser);
  });
  const records = {};
  const fail = () => { throw new Error('INVALID_EXPORT_FILE'); };
  for (const row of rows) {
    const table = row.table_name;
    if (!Object.hasOwn(layout, table) || Object.hasOwn(records, table)) fail();
    if (row.format !== 'snapbuy-postgres-text-v1') fail();
    let sourceTables, cols, parsed;
    try { sourceTables = JSON.parse(row.source_tables); cols = JSON.parse(row.column_names); parsed = JSON.parse(row.records); }
    catch { fail(); }
    if (!Array.isArray(sourceTables) || sourceTables.some(name => !Object.hasOwn(layout, name) && name !== '_prisma_migrations')) throw new Error('SOURCE_EXTRA_TABLES');
    if (!Array.isArray(cols) || cols.length !== layout[table].length || new Set(cols).size !== cols.length || cols.some(col => !layout[table].includes(col))) throw new Error('SCHEMA_MISMATCH');
    if (!Array.isArray(parsed) || !/^\d+$/.test(row.row_count) || parsed.length !== Number(row.row_count)) fail();
    if (createHash('md5').update(row.records).digest('hex') !== row.content_md5) fail();
    const ids = new Set();
    records[table] = parsed.map(record => {
      if (!record || typeof record !== 'object' || Array.isArray(record) || Object.keys(record).length !== cols.length) fail();
      const normalized = {};
      for (const col of layout[table]) {
        if (!Object.hasOwn(record, col) || !(record[col] === null || typeof record[col] === 'string')) fail();
        normalized[col] = record[col];
      }
      if (!/^[1-9]\d*$/.test(normalized.id) || !Number.isSafeInteger(Number(normalized.id)) || ids.has(normalized.id)) fail();
      ids.add(normalized.id);
      return normalized;
    }).sort((a, b) => Number(a.id) - Number(b.id));
  }
  if (Object.keys(records).length !== Object.keys(layout).length) fail();
  return records;
}
