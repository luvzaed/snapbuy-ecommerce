'use client';

import { useAuth } from '@/lib/auth-context';
import { Product } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, ArrowRight, ShoppingBag, Plus, Minus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

function CartItemRow({
  item,
  liveStock,
}: {
  item: { product: Product; quantity: number };
  // Current DB stock for this product. undefined until the live fetch resolves,
  // in which case we fall back to the (possibly stale) stock stored in the cart.
  liveStock: number | undefined;
}) {
  const { removeFromCart, updateQuantity } = useAuth();
  const stock = liveStock ?? item.product.stock;
  const outOfStock = stock === 0;

  return (
    <div
      className={`bg-white dark:bg-slate-900 border shadow-sm rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-300 ${
        outOfStock
          ? 'border-red-200 dark:border-red-900/50'
          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:scale-[1.01]'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.product.image}
          alt={item.product.name}
          className={`w-full h-full object-cover ${outOfStock ? 'opacity-50' : ''}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-slate-900 dark:text-white font-semibold truncate">
          {item.product.name}
        </h3>
        <p className="text-slate-500 text-sm">
          {item.product.category}
        </p>
        <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-1">
          ₺{item.product.price.toFixed(2)} / adet
        </p>
        {outOfStock ? (
          <span className="inline-block mt-1.5 px-2.5 py-1 text-[10px] bg-red-500/90 backdrop-blur-md rounded-lg font-bold tracking-wider text-white shadow-sm">
            Stokta Yok
          </span>
        ) : (
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">
            Stokta {stock} adet
          </p>
        )}
      </div>
      </div>

      <div className="flex items-center justify-between gap-4 w-full sm:w-auto">
      {/* Quantity Controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
          disabled={outOfStock}
          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-800 disabled:hover:text-slate-600"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-9 text-center text-sm font-bold text-slate-900 dark:text-white tabular-nums">
          {item.quantity}
        </span>
        <button
          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
          disabled={outOfStock || item.quantity >= stock}
          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-800 disabled:hover:text-slate-600"
          aria-label="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-slate-900 dark:text-white font-bold text-lg">
          ₺{(item.product.price * item.quantity).toFixed(2)}
        </p>
        <button
          onClick={() => removeFromCart(item.product.id)}
          className="mt-2 p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-110"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { cart, user, loading, updateQuantity } = useAuth();
  const router = useRouter();

  // Live (current) DB stock per product id. The cart in localStorage can hold
  // stale stock, so we re-fetch on load and reconcile each item against it.
  const [liveStock, setLiveStock] = useState<Record<number, number>>({});

  useEffect(() => {
    // Wait for the cart to hydrate from localStorage before reconciling.
    if (loading || cart.length === 0) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/products');
        if (!res.ok || cancelled) return;
        const products: Product[] = await res.json();
        if (cancelled) return;

        const map: Record<number, number> = {};
        products.forEach((p) => {
          map[p.id] = p.stock;
        });
        setLiveStock(map);

        // Cap any quantity that now exceeds available stock (stock > 0 only;
        // 0-stock items stay visible and are handled by the OOS badge).
        cart.forEach((item) => {
          const stock = map[item.product.id];
          if (stock === undefined) return;
          if (stock > 0 && item.quantity > stock) {
            updateQuantity(item.product.id, stock);
            toast(
              `"${item.product.name}" için stok ${stock} adede düştü. Sepetiniz güncellendi.`,
              { icon: '⚠️' },
            );
          }
        });
      } catch (err) {
        console.error('Failed to fetch live stock:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Reconcile once on load; capping mutates the cart but must not re-trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Any item whose current stock is 0 blocks checkout.
  const hasOutOfStock = cart.some(
    (item) => (liveStock[item.product.id] ?? item.product.stock) === 0,
  );

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  // Navigate to the multi-step checkout (shipping → payment → review).
  // The order is placed at the end of the checkout wizard, not here.
  const handleCheckout = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    // Don't let the user proceed while an unavailable item is in the cart.
    if (hasOutOfStock) {
      toast.error('Devam etmeden önce stokta olmayan ürünü sepetinizden çıkarın.');
      return;
    }
    router.push('/checkout');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-10">
        <ShoppingCart className="w-7 h-7 text-indigo-500" />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Alışveriş Sepeti</h1>
        <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-sm font-medium">
          {cart.length} ürün
        </span>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-16 text-center">
          <ShoppingBag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Sepetiniz boş
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Başlamak için harika ürünler ekleyin
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl gradient-brand text-white font-semibold hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
          >
            Ürünlere Göz At <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {cart.map((item) => (
              <CartItemRow
                key={item.product.id}
                item={item}
                liveStock={liveStock[item.product.id]}
              />
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 h-fit sticky top-20">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Sipariş Özeti
            </h2>
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Ara Toplam</span>
                <span className="font-medium">₺{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Kargo</span>
                <span className="text-emerald-600 font-medium">Ücretsiz</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>KDV (%20)</span>
                <span className="font-medium">
                  ₺{(total * 0.20).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between text-slate-900 dark:text-white font-bold text-lg">
                <span>Toplam</span>
                <span className="text-gradient">
                  ₺{(total * 1.08).toFixed(2)}
                </span>
              </div>
            </div>
            {user && hasOutOfStock && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Sepetinizde stokta olmayan bir ürün var. Devam etmek için lütfen
                  o ürünü sepetinizden çıkarın.
                </span>
              </div>
            )}
            <button
              onClick={handleCheckout}
              disabled={!!user && hasOutOfStock}
              className="w-full py-4 rounded-xl gradient-brand text-white font-semibold hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {user ? (
                <>
                  Siparişi Ver
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Ödeme için Giriş Yap
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            {!user && (
              <p className="text-center text-slate-500 text-xs mt-3">
                <Link
                  href="/login"
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Giriş yap
                </Link>{' '}
                — alışverişinizi tamamlamak için
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
