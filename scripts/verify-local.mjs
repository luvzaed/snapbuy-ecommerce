import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });

// Use only this launcher's database. Never read the original Supabase .env.
const ci = process.argv.includes('--ci');
if (ci) {
  assert.equal(process.env.CI, 'true');
  const url = new URL(process.env.DATABASE_URL);
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.pathname, '/snapbuy_ci');
}
const settings = ci ? { database: 'snapbuy_local', port: 55432, jwtSecret: process.env.JWT_SECRET } : { ...JSON.parse(fs.readFileSync('.local/settings.json', 'utf8')), jwtSecret: process.env.JWT_SECRET };
assert.equal(settings.database, 'snapbuy_local');
assert.equal(settings.port, 55432);
const db = new Client(ci ? { connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 } : { host: '127.0.0.1', port: 55432, database: 'snapbuy_local',
  user: 'snapbuy_app', password: settings.appPassword, connectionTimeoutMillis: 5000 });
db.on('error', () => { console.error('Verification database connection dropped.'); });
await db.connect();
const base = 'http://127.0.0.1:3000';
const stamp = Date.now();
const email = `local-test-${stamp}@example.com`;
const password = `Local-test-${stamp}!`;
let userId, productId, adminId;
const adminEmail = `local-admin-test-${stamp}@example.com`;
let passed = 0;
async function request(path, method = 'GET', body, cookie, extraHeaders = {}) {
  const response = await fetch(base + path, { method, signal: AbortSignal.timeout(90000),
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}), ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  let json; try { json = JSON.parse(text); } catch { json = null; }
  return { status: response.status, json, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
function check(name, actual, expected) {
  assert.deepEqual(actual, expected, name);
  passed++; console.log(`PASS: ${name}`);
}
try {
  // Verify the server uses this copy's unique signing secret before any writes.
  const adminRow = await db.query('INSERT INTO "User" (email, name, password, role, "updatedAt") VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
    [adminEmail, 'Temporary verification administrator', await bcrypt.hash(password, 12), 'ADMIN']);
  adminId = adminRow.rows[0].id;
  const admin = await request('/api/users/login', 'POST', { email: adminEmail, password });
  check('Local administrator login succeeds', admin.status, 200);
  assert.ok(admin.cookie, 'Local admin cookie is required');
  jwt.verify(admin.cookie.slice('auth_session='.length), settings.jwtSecret, { algorithms: ['HS256'] });
  check('Local administrator can read users', (await request('/api/users', 'GET', undefined, admin.cookie)).status, 200);
  check('Cross-site mutations are rejected', (await request('/api/users/logout', 'POST', {}, admin.cookie, { Origin: 'https://attacker.invalid', 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  check('Protected orders reject anonymous access', (await request('/api/orders?all=true')).status, 401);
  const registered = await request('/api/users', 'POST', { name: 'Local verification', email, password });
  userId = registered.json?.id;
  check('Registration uses the local database', registered.status, 201);
  const login = await request('/api/users/login', 'POST', { email, password });
  check('Login succeeds', login.status, 200);
  assert.ok(login.cookie, 'Login must set a session cookie');
  check('Session can be verified', (await request('/api/users/me', 'GET', undefined, login.cookie)).status, 200);
  check('Ordinary user cannot list all users', (await request('/api/users', 'GET', undefined, login.cookie)).status, 403);
  const loginClaims = jwt.verify(login.cookie.slice('auth_session='.length), settings.jwtSecret);
  const forgedRole = `auth_session=${jwt.sign({ id: userId, role: 'admin', jti: loginClaims.jti }, settings.jwtSecret, { algorithm: 'HS256', expiresIn: '5m' })}`;
  check('A stale admin claim cannot grant an ordinary user privileges', (await request('/api/users', 'GET', undefined, forgedRole)).status, 403);
  const accounts = await request('/api/users', 'GET', undefined, admin.cookie);
  check('Admin user listing excludes passwords', accounts.json.every(account => !Object.hasOwn(account, 'password')), true);
  const product = await db.query('INSERT INTO "Product" (name, price, stock, image, description, category, "updatedAt") VALUES ($1, 10, 3, $2, $3, $4, NOW()) RETURNING id',
    [`__LOCAL_TEST_${stamp}`, '/images/products/placeholder.png', 'Temporary verification fixture', 'Test']);
  productId = product.rows[0].id;
  const unsafeImage = await request('/api/products', 'POST', { name: 'Temporary invalid fixture', price: 1, stock: 1, image: '/images/products/../../secret.txt' }, admin.cookie);
  check('Traversal image references are rejected', unsafeImage.status, 400);
  const review = await request('/api/reviews', 'POST', { userId, productId, rating: 5, comment: 'Temporary verification' }, login.cookie);
  check('A review can be created', review.status, 201);
  const reviews = await request(`/api/reviews?productId=${productId}`);
  check('Public reviews exclude email addresses', reviews.json.every(item => !Object.hasOwn(item.user, 'email')), true);
  check('Negative order quantity is rejected', (await request('/api/orders', 'POST', { items: [{ productId, quantity: -1 }] }, login.cookie)).status, 400);
  check('Duplicate products are rejected', (await request('/api/orders', 'POST', { items: [{ productId, quantity: 1 }, { productId, quantity: 1 }] }, login.cookie)).status, 400);
  check('Overselling is rejected', (await request('/api/orders', 'POST', { items: [{ productId, quantity: 4 }] }, login.cookie)).status, 400);
  check('A changed checkout total is rejected', (await request('/api/orders', 'POST', { total: 1, items: [{ productId, quantity: 2 }] }, login.cookie)).status, 409);
  check('Rejected quote does not reduce stock', (await db.query('SELECT stock FROM "Product" WHERE id = $1', [productId])).rows[0].stock, 3);
  const order = await request('/api/orders', 'POST', { total: 24, items: [{ productId, quantity: 2 }], shipping: { fullName: 'Local test', city: 'Test', cvv: '123' } }, login.cookie);
  check('Order can be placed', order.status, 201);
  check('Order total uses database price and tax', order.json.total, 24);
  check('Unexpected payment fields cannot be saved in shipping', Object.hasOwn(order.json.shipping, 'cvv'), false);
  await db.query('UPDATE "User" SET role = $1 WHERE id = $2', ['USER', adminId]);
  check('Demoted administrator loses API privileges immediately', (await request('/api/users', 'GET', undefined, admin.cookie)).status, 403);
  check('Another account cannot read the order', (await request(`/api/orders/${order.json.id}`, 'GET', undefined, admin.cookie)).status, 403);
  await db.query('UPDATE "User" SET role = $1 WHERE id = $2', ['ADMIN', adminId]);
  const stock = await db.query('SELECT stock FROM "Product" WHERE id = $1', [productId]);
  check('Stock is reduced correctly', stock.rows[0].stock, 1);
  const logout = await request('/api/users/logout', 'POST', {}, login.cookie);
  check('Logout succeeds', logout.status, 200);
  check('Logout clears the cookie', logout.cookie, 'auth_session=');
  check('A copied cookie cannot be replayed after logout', (await request('/api/users/me', 'GET', undefined, login.cookie)).status, 401);
  check('Missing cookie cannot reuse the session', (await request('/api/users/me')).status, 401);
  const fresh = await request('/api/users/login', 'POST', { email, password });
  const otherDevice = await request('/api/users/login', 'POST', { email, password });
  check('Password change succeeds', (await request(`/api/users/${userId}`, 'PUT', { currentPassword: password, newPassword: password + '-new' }, fresh.cookie)).status, 200);
  check('Password change revokes the current session', (await request('/api/users/me', 'GET', undefined, fresh.cookie)).status, 401);
  check('Password change revokes other device sessions', (await request('/api/users/me', 'GET', undefined, otherDevice.cookie)).status, 401);
  check('Old password stops working', (await request('/api/users/login', 'POST', { email, password })).status, 401);
  const newLogin = await request('/api/users/login', 'POST', { email, password: password + '-new' });
  check('New password can sign in', newLogin.status, 200);
  check('Confirmation can read the exact created order', (await request(`/api/orders/${order.json.id}`, 'GET', undefined, newLogin.cookie)).json.id, order.json.id);
  const secondOrder = await request('/api/orders', 'POST', { total: 12, items: [{ productId, quantity: 1 }] }, newLogin.cookie);
  check('A second order can be placed', secondOrder.status, 201);
  check('First confirmation stays on its original order', (await request(`/api/orders/${order.json.id}`, 'GET', undefined, newLogin.cookie)).json.id, order.json.id);
  check('Administrator can delete an order', (await request(`/api/orders/${secondOrder.json.id}`, 'DELETE', undefined, admin.cookie)).status, 200);
  check('Order deletion removes its items', Number((await db.query('SELECT COUNT(*) AS count FROM "OrderItem" WHERE "orderId" = $1', [secondOrder.json.id])).rows[0].count), 0);
  console.log(`\n${passed} checks passed. Connected to PostgreSQL on this computer.`);
} catch (error) {
  console.error(`Verification failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  // Delete only fixtures owned by this run, in foreign-key order.
  try {
    if (userId) {
      await db.query('DELETE FROM "Review" WHERE "userId" = $1', [userId]);
      await db.query('DELETE FROM "OrderItem" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "userId" = $1)', [userId]);
      await db.query('DELETE FROM "Order" WHERE "userId" = $1', [userId]);
      await db.query('DELETE FROM "User" WHERE id = $1 AND email = $2', [userId, email]);
    }
    if (productId) await db.query('DELETE FROM "Product" WHERE id = $1 AND name = $2', [productId, `__LOCAL_TEST_${stamp}`]);
    if (adminId) await db.query('DELETE FROM "User" WHERE id = $1 AND email = $2', [adminId, adminEmail]);
  } finally { await db.end(); }
}
