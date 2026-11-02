import test from 'node:test';
import assert from 'node:assert/strict';
import { rejectCrossSiteMutation } from '../lib/request-security.ts';
import { validateImageReference, saveUploadedImage, ImageValidationError } from '../lib/product-images.ts';

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
