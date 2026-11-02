import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { exportSnapshot } from './supabase-export.mjs';

const layout = { User: ['id', 'email'], Product: ['id', 'name'] };
function fixture({ alwaysDrop = false, mismatch = false } = {}) {
  const state = { connections: 0, ended: 0, statements: [] };
  class FakeClient extends EventEmitter {
    constructor() { super(); this.attempt = ++state.connections; }
    async connect() { assert.equal(this.listenerCount('error'), 1); }
    async query(sql, params) {
      state.statements.push(sql);
      if (sql.includes('FROM pg_tables')) return { rows: [{ tablename: 'User' }, { tablename: 'Product' }] };
      if (sql.includes('information_schema.columns')) return { rows: (mismatch ? ['id'] : layout[params[1]]).map(column_name => ({ column_name })) };
      if (sql.includes('FROM public."User"')) return { rows: [{ id: String(this.attempt), email: 'fixture@example.com' }] };
      if (sql.includes('FROM public."Product"')) {
        if (alwaysDrop || this.attempt === 1) {
          // This was previously an uncaught EventEmitter error outside query rejection.
          this.emit('error', new Error('Connection terminated unexpectedly'));
          return { rows: [] };
        }
        return { rows: [{ id: '5', name: 'Fixture' }] };
      }
      assert.match(sql, /^(BEGIN TRANSACTION .*READ ONLY|SET LOCAL TIME ZONE|ROLLBACK)/);
      return { rows: [] };
    }
    async end() { state.ended++; }
  }
  return { state, options: { ClientClass: FakeClient, delay: async () => {}, progress: () => {} } };
}

test('a dropped connection is handled and the entire partial snapshot is discarded', async () => {
  const { state, options } = fixture();
  const records = await exportSnapshot({}, layout, options);
  assert.equal(state.connections, 2);
  assert.equal(state.ended, 2);
  assert.equal(records.User[0].id, '2');
  assert.equal(records.Product.length, 1);
  assert.ok(state.statements.filter(sql => sql.startsWith('BEGIN')).every(sql => sql.endsWith('READ ONLY')));
});

test('repeated disconnects stop after three attempts and identify Supabase', async () => {
  const { state, options } = fixture({ alwaysDrop: true });
  await assert.rejects(exportSnapshot({}, layout, options), error => error.databaseEndpoint === 'Supabase');
  assert.equal(state.connections, 3);
  assert.equal(state.ended, 3);
});

test('a schema mismatch stops without retrying or returning a partial export', async () => {
  const { state, options } = fixture({ mismatch: true });
  await assert.rejects(exportSnapshot({}, layout, options), /SCHEMA_MISMATCH/);
  assert.equal(state.connections, 1);
  assert.equal(state.ended, 1);
});
