import test from 'node:test';
import assert from 'node:assert/strict';
import { rejectCrossSiteMutation } from '../lib/request-security.ts';
import { validateImageReference, saveUploadedImage, ImageValidationError } from '../lib/product-images.ts';
import { hashPassword, verifyPassword } from '../lib/password.ts';

test('browser origins cannot submit authenticated mutations across sites', () => {
  const request = origin => new Request('http://localhost:3000/api/users/logout', { method: 'POST', headers: { origin } });
  assert.equal(rejectCrossSiteMutation(request('https://attacker.invalid')), true);
  assert.equal(rejectCrossSiteMutation(request('http://localhost:3000')), false);
  assert.equal(rejectCrossSiteMutation(new Request('http://localhost:3000/api/orders', { method: 'POST' })), false);
  assert.equal(rejectCrossSiteMutation(request('null')), true);
});
test('image URLs reject traversal, SVG and unapproved internal destinations', () => {
  for (const value of ['/images/products/../../.env', '/images/products/test.svg', 'http://127.0.0.1/private', 'https://localhost/private', 'https://attacker.invalid/img.png']) {
    assert.throws(() => validateImageReference(value), ImageValidationError);
  }
  assert.equal(validateImageReference('/images/products/example.jpg'), '/images/products/example.jpg');
});
test('image uploads reject oversized, scripted and fake images before writing files', async () => {
  await assert.rejects(saveUploadedImage(new File(['<svg onload="alert(1)"/>'], 'image.png', { type: 'image/png' })), ImageValidationError);
  await assert.rejects(saveUploadedImage(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.jpg')), ImageValidationError);
});
test('password verification accepts bcrypt and refuses legacy plaintext values', async () => {
  const hash = await hashPassword('Test-only-password!');
  assert.equal(await verifyPassword('Test-only-password!', hash), true);
  assert.equal(await verifyPassword('wrong', hash), false);
  assert.equal(await verifyPassword('Test-only-password!', 'Test-only-password!'), false);
});

test('local browser origins follow the actual Host when Next.js normalizes its URL', () => {
  const request = (url, host, origin, extra = {}) => new Request(`${url}/api/visual-search`, {
    method: 'POST', headers: { host, origin, 'sec-fetch-site': 'same-origin', ...extra },
  });
  assert.equal(rejectCrossSiteMutation(request('http://localhost:3000', '127.0.0.1:3000', 'http://127.0.0.1:3000')), false);
  assert.equal(rejectCrossSiteMutation(request('http://127.0.0.1:3000', 'localhost:3000', 'http://localhost:3000')), false);
  assert.equal(rejectCrossSiteMutation(request('http://localhost:3000', '[::1]:3000', 'http://[::1]:3000')), false);
  assert.equal(rejectCrossSiteMutation(request('http://localhost:3000', '127.0.0.1:3000', 'http://localhost:3000')), true);
  assert.equal(rejectCrossSiteMutation(request('http://localhost:3000', '127.0.0.1:3000', 'https://attacker.invalid')), true);
  assert.equal(rejectCrossSiteMutation(request('http://localhost:3000', 'attacker.invalid', 'http://attacker.invalid')), true);
  assert.equal(rejectCrossSiteMutation(request('http://localhost:3000', '127.0.0.1:4000', 'http://127.0.0.1:4000')), true);
  assert.equal(rejectCrossSiteMutation(request('http://localhost:3000', '127.0.0.1:3000', 'http://127.0.0.1:3000', { 'sec-fetch-site': 'cross-site' })), true);
  assert.equal(rejectCrossSiteMutation(request('http://localhost:3000', '127.0.0.1:3000', 'https://attacker.invalid', { 'x-forwarded-host': 'attacker.invalid', 'x-forwarded-proto': 'https' })), true);
  assert.equal(rejectCrossSiteMutation(request('https://shop.example', 'attacker.invalid', 'https://attacker.invalid')), true);
});

test('a configured application origin stays authoritative', () => {
  const previous = process.env.APP_ORIGIN;
  process.env.APP_ORIGIN = 'https://shop.example';
  try {
    const request = origin => new Request('http://localhost:3000/api/visual-search', {
      method: 'POST', headers: { host: '127.0.0.1:3000', origin, 'sec-fetch-site': 'same-origin' },
    });
    assert.equal(rejectCrossSiteMutation(request('https://shop.example')), false);
    assert.equal(rejectCrossSiteMutation(request('http://127.0.0.1:3000')), true);
  } finally {
    if (previous === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = previous;
  }
});
