import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyImportValues } from './verify-import-values.mjs';

test('verification does not hide timestamp precision loss or embed private values in SQL', async () => {
  const privateValue = "private@example.com'; SELECT 1; --";
  let compared = false;
  const client = { async query(sql, values) {
    if (sql.includes('pg_attribute')) return { rows: [{ name: 'id', type: 'integer' }, { name: 'email', type: 'text' }, { name: 'createdAt', type: 'timestamp without time zone' }] };
    compared = true;
    assert.ok(!sql.includes(privateValue));
    assert.ok(!sql.includes('timestamp(3)'));
    assert.ok(sql.includes('IS DISTINCT FROM $3::timestamp without time zone'));
    assert.equal(values[1], privateValue);
    assert.equal(values[2], '2026-11-02 12:00:00.123456');
    return { rows: [{ differences: ['createdAt'] }] };
  } };
  await assert.rejects(verifyImportValues(client, 'User', ['id', 'email', 'createdAt'], [{ id: '1', email: privateValue, createdAt: '2026-11-02 12:00:00.123456' }], 1), error => {
    assert.equal(error.message, 'VERIFICATION_FAILED');
    assert.deepEqual(error.verification.columns, ['createdAt']);
    assert.ok(!JSON.stringify(error).includes(privateValue));
    return true;
  });
  assert.equal(compared, true);
});

test('missing or extra records fail before value comparison', async () => {
  const client = { query() { assert.fail('No comparison is needed for a wrong row count'); } };
  await assert.rejects(verifyImportValues(client, 'User', ['id'], [{ id: '1' }], 0), error => error.verification.reason === 'row_count');
});

test('a missing primary key cannot pass because the row count happens to match', async () => {
  const client = { async query(sql) {
    return sql.includes('pg_attribute') ? { rows: [{ name: 'id', type: 'integer' }] } : { rows: [] };
  } };
  await assert.rejects(verifyImportValues(client, 'User', ['id'], [{ id: '1' }], 1), error => error.verification.reason === 'missing_record');
});
