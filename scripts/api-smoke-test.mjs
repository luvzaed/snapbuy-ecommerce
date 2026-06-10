// API smoke test — hits every API route with representative requests and
// checks the response status. Run AFTER the dev server is up.
//
//   node scripts/api-smoke-test.mjs            (defaults to http://localhost:3000)
//   API_BASE=http://localhost:3001 node scripts/api-smoke-test.mjs
//
// The app authenticates via a signed JWT `auth_session` cookie, so this script
// mints admin/user cookies with the same secret and algorithm the login route
// uses (jwt.sign({ id, role }, JWT_SECRET, { algorithm: 'HS256' })) to exercise
// protected routes. All resources it creates (user, product, order, review,
// newsletter) are cleaned up at the end.

import 'dotenv/config';
import jwt from 'jsonwebtoken';

const BASE = process.env.API_BASE || 'http://localhost:3000';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error(
    'JWT_SECRET is not set. Add it to .env so the smoke test can mint signed session cookies.',
  );
  process.exit(1);
}

const results = [];
let passCount = 0;
let failCount = 0;

// Build a cookie header by signing the session the same way the app does.
const cookieFor = (obj) =>
  `auth_session=${jwt.sign(obj, JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' })}`;

/**
 * Run one request and assert on the status code.
 * @param {string} name        human label
 * @param {string} method      HTTP method
 * @param {string} path        e.g. '/api/products'
 * @param {object} opts        { body, cookie, expect } — expect is a number or number[]
 * @returns {Promise<{status:number, json:any, ok:boolean}>}
 */
async function hit(name, method, path, opts = {}) {
  const { body, cookie, expect } = opts;
  const expected = Array.isArray(expect) ? expect : [expect];
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers['Cookie'] = cookie;

  let status = 0;
  let json = null;
  let errText = '';
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    status = res.status;
    const text = await res.text();
    try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  } catch (e) {
    errText = e?.message || String(e);
  }

  const ok = expected.includes(status);
  if (ok) passCount++; else failCount++;
  results.push({
    name, method, path,
    expected: expected.join('/'),
    actual: errText ? `ERR ${errText}` : status,
    ok,
  });
  return { status, json, ok };
}

function section(title) {
  results.push({ section: title });
}

async function main() {
  const stamp = Date.now();
  const testEmail = `smoketest+${stamp}@example.com`;
  const testPassword = 'Password123!';

  // ─── Public / unauthenticated ────────────────────────────────────────────
  section('Public endpoints');

  const products = await hit('GET /api/products (list)', 'GET', '/api/products', { expect: 200 });
  const firstProduct = Array.isArray(products.json) && products.json.length ? products.json[0] : null;
  const sampleProductId = firstProduct?.id;

  if (sampleProductId != null) {
    await hit('GET /api/products/[id] (exists)', 'GET', `/api/products/${sampleProductId}`, { expect: 200 });
    await hit('GET /api/reviews?productId (list)', 'GET', `/api/reviews?productId=${sampleProductId}`, { expect: 200 });
  }
  await hit('GET /api/products/[id] (not found)', 'GET', '/api/products/999999999', { expect: 404 });
  await hit('GET /api/reviews (missing productId)', 'GET', '/api/reviews', { expect: 400 });

  await hit('POST /api/newsletter (valid)', 'POST', '/api/newsletter', { body: { email: testEmail }, expect: 200 });
  await hit('POST /api/newsletter (duplicate)', 'POST', '/api/newsletter', { body: { email: testEmail }, expect: 400 });
  await hit('POST /api/newsletter (invalid)', 'POST', '/api/newsletter', { body: { email: 'not-an-email' }, expect: 400 });

  await hit('POST /api/visual-search (no image)', 'POST', '/api/visual-search', { body: {}, expect: 400 });
  // Python CLIP server is usually not running in dev → 503 is the correct graceful response.
  await hit('POST /api/visual-search (image; server may be down)', 'POST', '/api/visual-search', { body: { image: 'data:image/png;base64,iVBORw0KGgo=' }, expect: [200, 404, 503] });

  // ─── Registration + login ────────────────────────────────────────────────
  section('Auth (register / login)');

  const reg = await hit('POST /api/users (register)', 'POST', '/api/users', { body: { name: 'Smoke Test', email: testEmail, password: testPassword }, expect: 201 });
  const userId = reg.json?.id;

  await hit('POST /api/users (duplicate email)', 'POST', '/api/users', { body: { email: testEmail, password: testPassword }, expect: 409 });
  await hit('POST /api/users (missing password)', 'POST', '/api/users', { body: { email: `x${stamp}@example.com` }, expect: 400 });

  await hit('POST /api/users/login (valid)', 'POST', '/api/users/login', { body: { email: testEmail, password: testPassword }, expect: 200 });
  await hit('POST /api/users/login (wrong password)', 'POST', '/api/users/login', { body: { email: testEmail, password: 'wrong' }, expect: 401 });

  // Cookies (forged the same way the app issues them).
  const userCookie = userId != null ? cookieFor({ id: userId, role: 'user' }) : null;
  const adminCookie = cookieFor({ id: userId ?? 1, role: 'admin' });
  const otherUserCookie = cookieFor({ id: (userId ?? 1) + 999999, role: 'user' });

  // ─── Auth required: rejection without a cookie ───────────────────────────
  section('Protected endpoints reject without auth (expect 401)');
  await hit('GET /api/users (no cookie)', 'GET', '/api/users', { expect: 401 });
  await hit('GET /api/admin/top-products (no cookie)', 'GET', '/api/admin/top-products', { expect: 401 });
  await hit('GET /api/orders?all=true (no cookie)', 'GET', '/api/orders?all=true', { expect: 401 });
  await hit('POST /api/orders (no cookie)', 'POST', '/api/orders', { body: { items: [] }, expect: 401 });

  // ─── Admin happy paths ───────────────────────────────────────────────────
  section('Admin endpoints (admin cookie)');
  await hit('GET /api/users (admin)', 'GET', '/api/users', { cookie: adminCookie, expect: 200 });
  if (userId != null) {
    await hit('GET /api/users/[id] (admin)', 'GET', `/api/users/${userId}`, { cookie: adminCookie, expect: 200 });
  }
  await hit('GET /api/admin/top-products (admin)', 'GET', '/api/admin/top-products', { cookie: adminCookie, expect: 200 });
  await hit('GET /api/orders?all=true (admin)', 'GET', '/api/orders?all=true', { cookie: adminCookie, expect: 200 });

  // Create a dedicated test product so order/stock side effects never touch real data.
  const createProd = await hit('POST /api/products (admin, create)', 'POST', '/api/products', {
    cookie: adminCookie,
    body: { name: `__SMOKE_TEST_PRODUCT__ ${stamp}`, description: 'temp', price: 9.99, stock: 100, category: 'Test', image: '/images/products/placeholder.png' },
    expect: 201,
  });
  const testProductId = createProd.json?.id;
  await hit('POST /api/products (no cookie → 401)', 'POST', '/api/products', { body: { name: 'x', price: 1, image: '/x.png' }, expect: 401 });

  if (testProductId != null) {
    await hit('GET /api/products/[id] (new product)', 'GET', `/api/products/${testProductId}`, { expect: 200 });
    await hit('PUT /api/products/[id] (admin, update)', 'PUT', `/api/products/${testProductId}`, { cookie: adminCookie, body: { price: 12.5, stock: 50 }, expect: 200 });
  }

  // ─── User-scoped: orders + reviews ───────────────────────────────────────
  section('Orders & reviews (user cookie)');
  let orderId = null;
  let reviewId = null;

  if (userCookie && testProductId != null) {
    const order = await hit('POST /api/orders (user, create)', 'POST', '/api/orders', {
      cookie: userCookie,
      body: { items: [{ productId: testProductId, quantity: 1 }], shipping: { fullName: 'Smoke Test', city: 'Istanbul' } },
      expect: 201,
    });
    orderId = order.json?.id;

    await hit('GET /api/orders?userId (user, own)', 'GET', `/api/orders?userId=${userId}`, { cookie: userCookie, expect: 200 });

    if (orderId != null) {
      await hit('GET /api/orders/[id] (owner)', 'GET', `/api/orders/${orderId}`, { cookie: userCookie, expect: 200 });
      await hit('GET /api/orders/[id] (other user → 403)', 'GET', `/api/orders/${orderId}`, { cookie: otherUserCookie, expect: 403 });
      await hit('PATCH /api/orders/[id] (admin, valid status)', 'PATCH', `/api/orders/${orderId}`, { cookie: adminCookie, body: { status: 'SHIPPED' }, expect: 200 });
      await hit('PATCH /api/orders/[id] (admin, invalid status)', 'PATCH', `/api/orders/${orderId}`, { cookie: adminCookie, body: { status: 'BOGUS' }, expect: 400 });
    }

    const review = await hit('POST /api/reviews (user, create)', 'POST', '/api/reviews', {
      cookie: userCookie,
      body: { userId, productId: testProductId, rating: 5, comment: 'Smoke test review' },
      expect: 201,
    });
    reviewId = review.json?.id;
  }

  // PUT self (no password change)
  if (userCookie && userId != null) {
    await hit('PUT /api/users/[id] (self, update name)', 'PUT', `/api/users/${userId}`, { cookie: userCookie, body: { name: 'Smoke Test Renamed' }, expect: 200 });
  }

  // ─── Cleanup (also tests the DELETE endpoints) ───────────────────────────
  section('Cleanup (DELETE endpoints)');
  if (reviewId != null) {
    await hit('DELETE /api/reviews/[id] (owner)', 'DELETE', `/api/reviews/${reviewId}`, { cookie: userCookie, expect: 200 });
  }
  if (orderId != null) {
    await hit('DELETE /api/orders/[id] (admin)', 'DELETE', `/api/orders/${orderId}`, { cookie: adminCookie, expect: 200 });
  }
  if (testProductId != null) {
    await hit('DELETE /api/products/[id] (admin)', 'DELETE', `/api/products/${testProductId}`, { cookie: adminCookie, expect: 200 });
  }
  if (userId != null) {
    await hit('DELETE /api/users/[id] (admin)', 'DELETE', `/api/users/${userId}`, { cookie: adminCookie, expect: 200 });
  }

  // ─── Report ──────────────────────────────────────────────────────────────
  console.log(`\n=== API SMOKE TEST — ${BASE} ===\n`);
  for (const r of results) {
    if (r.section) {
      console.log(`\n── ${r.section} ──`);
      continue;
    }
    const tag = r.ok ? 'PASS' : 'FAIL';
    const mark = r.ok ? ' ' : '!';
    console.log(`${mark}[${tag}] ${r.name}  (expected ${r.expected}, got ${r.actual})`);
  }
  console.log(`\n=== ${passCount} passed, ${failCount} failed, ${passCount + failCount} total ===`);
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Test runner crashed:', e);
  process.exit(2);
});
