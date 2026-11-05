// Run against the disposable CI server. All browser catalog/account data is mocked.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000', viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const phone = { id: 90001, name: 'Regression Phone', description: 'Phone fixture', price: 10, stock: 2, image: '/images/products/placeholder.png', category: 'Electronics' };
const laptop = { ...phone, id: 90002, name: 'Regression Laptop', description: 'Laptop fixture' };
let products = [phone, laptop];
let failCatalog = false;
await context.route('**/api/products', route => route.fulfill({ status: failCatalog ? 500 : 200, json: failCatalog ? { error: 'Database unavailable' } : products }));
await context.route('**/api/users/me', route => route.fulfill({ status: 401, json: { error: 'Unauthorized' } }));
try {
  await page.goto('/shop?q=Phone');
  await page.getByRole('heading', { name: phone.name, exact: true }).waitFor();
  await page.locator('#header-search').fill('Laptop');
  await page.locator('#header-search').press('Enter');
  await page.getByRole('heading', { name: laptop.name, exact: true }).waitFor();
  assert.equal(await page.getByRole('heading', { name: phone.name, exact: true }).count(), 0);
  console.log('PASS: header search updates an already open shop');

  failCatalog = true;
  await page.goto('/shop');
  await page.getByRole('button', { name: 'Tekrar dene', exact: true }).waitFor();
  failCatalog = false;
  await page.getByRole('button', { name: 'Tekrar dene', exact: true }).click();
  await page.getByRole('heading', { name: phone.name, exact: true }).waitFor();
  console.log('PASS: catalog failure displays a working retry without crashing');

  products = [{ ...phone, price: 25, stock: 10 }];
  await page.evaluate(item => localStorage.setItem('shop_cart', JSON.stringify([{ product: item, quantity: 2 }])), phone);
  await page.goto('/cart');
  await page.getByText('₺25.00 / adet', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('shop_cart'))?.[0]?.quantity === 3);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_cart')));
  assert.equal(stored[0].quantity, 3);
  assert.equal(stored[0].product.stock, 10);
  assert.equal(stored[0].product.price, 25);
  console.log('PASS: refreshed cart uses the current price and permits restocked quantity');
  assert.deepEqual(errors, [], 'Browser must not throw an unhandled exception');
} finally {
  await browser.close();
}
