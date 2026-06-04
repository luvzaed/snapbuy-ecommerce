'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ShoppingCart, Check, Minus, Plus } from 'lucide-react';
import { Product } from '@/lib/types';

export default function ProductActions({ product }: { product: Product }) {
  const { addToCart } = useAuth();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const decrement = () => setQty((q) => Math.max(1, q - 1));
  const increment = () => setQty((q) => Math.min(product.stock, q + 1));

  const handleAdd = () => {
    if (product.stock === 0) return;
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setQty(1);
    }, 1600);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Low-stock / out-of-stock inline alert */}
      {product.stock === 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          Bu ürün şu an tükendi
        </div>
      )}
      {product.stock > 0 && product.stock <= 5 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
          Son {product.stock} ürün kaldı!
        </div>
      )}

      {/* Quantity selector — hidden when out of stock */}
      {product.stock > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Adet:
          </span>
          <div className="flex items-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1">
            <button
              onClick={decrement}
              disabled={qty <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-bold text-slate-900 dark:text-white tabular-nums select-none">
              {qty}
            </span>
            <button
              onClick={increment}
              disabled={qty >= product.stock}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {product.stock} stokta
          </span>
        </div>
      )}

      {/* Add to Cart button */}
      <button
        onClick={handleAdd}
        disabled={product.stock === 0}
        className={`flex items-center justify-center gap-3 font-bold py-4 px-8 rounded-xl transition-all duration-300 ${
          added
            ? 'bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/30'
        } disabled:opacity-50 disabled:scale-100 cursor-pointer`}
      >
        {added ? (
          <>
            <Check className="w-5 h-5" />
            Sepete Eklendi!
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            {product.stock > 0 ? 'Sepete Ekle' : 'Stokta Yok'}
          </>
        )}
      </button>
    </div>
  );
}
