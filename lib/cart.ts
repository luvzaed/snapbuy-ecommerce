import type { CartItem, Product } from './types';

export function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false;
  const p = value as Product;
  return Number.isSafeInteger(p.id) && p.id > 0 &&
    Number.isFinite(p.price) && p.price >= 0 && Number.isSafeInteger(p.stock) && p.stock >= 0 &&
    ['name', 'description', 'image', 'category'].every(key => typeof p[key as keyof Product] === 'string');
}

export async function requestProducts(signal?: AbortSignal): Promise<Product[]> {
  const response = await fetch('/api/products', { cache: 'no-store', signal });
  if (!response.ok) throw new Error('Ürünler yüklenemedi. Lütfen tekrar deneyin.');
  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isProduct)) throw new Error('Geçersiz ürün yanıtı. Lütfen tekrar deneyin.');
  return data;
}

export function readStoredCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  return value.filter((item): item is CartItem => {
    if (!item || !isProduct(item.product) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || seen.has(item.product.id)) return false;
    seen.add(item.product.id);
    return true;
  }).map(item => ({ ...item, quantity: Math.min(item.quantity, 100) }));
}

export function reconcileCart(cart: CartItem[], products: Product[]): CartItem[] {
  const current = new Map(products.map(p => [p.id, p]));
  const updated = cart.flatMap(item => {
    const product = current.get(item.product.id);
    if (!product) return [];
    // Keep unavailable items visible so the customer can remove them.
    return [{ product, quantity: product.stock === 0 ? item.quantity : Math.min(item.quantity, product.stock, 100) }];
  });
  return JSON.stringify(updated) === JSON.stringify(cart) ? cart : updated;
}

export function addCartItem(cart: CartItem[], product: Product, quantity: number): CartItem[] {
  if (!isProduct(product) || !Number.isSafeInteger(quantity) || quantity < 1 || product.stock === 0) return cart;
  const existing = cart.find(item => item.product.id === product.id);
  const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, product.stock, 100);
  return existing ? cart.map(item => item.product.id === product.id ? { product, quantity: nextQuantity } : item)
    : [...cart, { product, quantity: nextQuantity }];
}
