import test from 'node:test';
import assert from 'node:assert/strict';
import { addCartItem, readStoredCart, reconcileCart, requestProducts } from '../lib/cart.ts';
import { prepareLocalEnv } from './local-env.mjs';

const product = { id: 1, name: 'Phone', description: 'Test', image: '/images/products/phone.jpg', category: 'Electronics', price: 10, stock: 2 };

test('startup preserves custom settings, secrets, comments and is idempotent', () => {
  const original = '# Keep my settings\nDATABASE_URL="postgresql://local/test"\nJWT_SECRET="custom"\nAPP_ORIGIN="http://127.0.0.1:3000"\nALLOWED_IMAGE_HOSTS="images.example.com"\n';
  const defaults = { DATABASE_URL: 'postgresql://local/test', JWT_SECRET: 'generated', VISUAL_SEARCH_URL: 'http://127.0.0.1:8000' };
  const result = prepareLocalEnv(original, defaults);
  assert.ok(result.startsWith(original));
  assert.equal(result.includes('generated'), false);
  assert.equal(prepareLocalEnv(result, defaults), result);
  assert.throws(() => prepareLocalEnv(original, { DATABASE_URL: 'postgresql://other/db' }), /Refusing to overwrite/);
});

test('cart refresh replaces stale prices and stock before quantity changes', () => {
  const original = [{ product, quantity: 2 }];
  const refreshed = reconcileCart(original, [{ ...product, stock: 10, price: 20 }]);
  assert.equal(refreshed[0].product.price, 20);
  assert.equal(addCartItem(refreshed, refreshed[0].product, 1)[0].quantity, 3);
  assert.equal(original[0].product.stock, 2);
  assert.equal(reconcileCart(refreshed, [{ ...product, stock: 10, price: 20 }]), refreshed);
});

test('cart handles lower stock, deleted products, unavailable items and rapid additions', () => {
  const cart = [{ product: { ...product, stock: 10 }, quantity: 8 }];
  assert.equal(reconcileCart(cart, [product])[0].quantity, 2);
  assert.deepEqual(reconcileCart(cart, []), []);
  assert.equal(reconcileCart(cart, [{ ...product, stock: 0 }])[0].product.stock, 0);
  const first = addCartItem([], product, 1);
  const second = addCartItem(first, product, 1);
  assert.equal(addCartItem(second, product, 1)[0].quantity, 2);
  assert.equal(addCartItem(second, product, -1), second);
});

test('untrusted stored cart cannot crash totals or inject invalid quantities', () => {
  assert.deepEqual(readStoredCart({ error: 'bad' }), []);
  assert.deepEqual(readStoredCart([{ product: { id: 1 }, quantity: 1 }, { product, quantity: -1 }]), []);
  assert.equal(readStoredCart([{ product, quantity: 1 }, { product, quantity: 1 }]).length, 1);
});

test('catalog errors and malformed bodies reject without being used as product arrays', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: 'Unavailable' }), { status: 500 }));
  await assert.rejects(requestProducts(), /yüklenemedi/);
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Bad response' }));
  await assert.rejects(requestProducts(), /Geçersiz/);
  globalThis.fetch = async () => new Response(JSON.stringify([product]));
  assert.deepEqual(await requestProducts(), [product]);
});
