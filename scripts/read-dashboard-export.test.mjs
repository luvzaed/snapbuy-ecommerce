import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readDashboardExport } from './read-dashboard-export.mjs';

const layout = { User: ['id', 'name'], Order: ['id', 'shipping'] };
const cell = value => '"' + String(value).replaceAll('"', '""') + '"';
function fixture(t, mutate = rows => rows) {
  const rows = Object.entries({ User: [{ id: '2', name: 'İstanbul, "test"\nnext line' }], Order: [{ id: '5', shipping: 'null' }, { id: '8', shipping: null }] }).map(([table, data]) => {
    const records = JSON.stringify(data);
    return { table_name: table, format: 'snapbuy-postgres-text-v1', source_tables: JSON.stringify(Object.keys(layout)), column_names: JSON.stringify(layout[table]), row_count: data.length, records, content_md5: createHash('md5').update(records).digest('hex') };
  });
  const headers = Object.keys(rows[0]);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapbuy-export-test-'));
  const filename = path.join(dir, 'export.csv');
  fs.writeFileSync(filename, '\uFEFF' + headers.join(',') + '\r\n' + mutate(rows).map(row => headers.map(key => cell(row[key])).join(',')).join('\r\n'));
  t.after(() => { fs.unlinkSync(filename); fs.rmdirSync(dir); });
  return filename;
}
test('CSV export preserves quoted UTF-8 text and distinguishes SQL null from JSON null', async t => {
  const result = await readDashboardExport(fixture(t), layout);
  assert.equal(result.User[0].name, 'İstanbul, "test"\nnext line');
  assert.equal(result.Order[0].shipping, 'null');
  assert.equal(result.Order[1].shipping, null);
});
test('missing table export is rejected', async t => {
  await assert.rejects(readDashboardExport(fixture(t, rows => rows.slice(0, 1)), layout), /INVALID_EXPORT_FILE/);
});
test('changed or truncated record content is rejected', async t => {
  await assert.rejects(readDashboardExport(fixture(t, rows => { rows[0].records = '[]'; return rows; }), layout), /INVALID_EXPORT_FILE/);
});
test('additional source tables are not silently ignored', async t => {
  await assert.rejects(readDashboardExport(fixture(t, rows => { rows[0].source_tables = '["ExtraPrivateTable"]'; return rows; }), layout), /SOURCE_EXTRA_TABLES/);
});
