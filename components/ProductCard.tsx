'use client';

import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/lib/auth-context';
import { ShoppingCart, Star, Check } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useAuth();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <Link href={`/product/${product.id}`} className="block">
      <div className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
        {/* Image container */}
        <div className="relative h-52 overflow-hidden bg-slate-50 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Subtle light overlay instead of the old dark one */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />

          {/* Badges: category always shown; stock status overlaid below it */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span className="px-2.5 py-1 text-xs bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-cyan-700 dark:text-cyan-400 font-bold rounded-lg border border-cyan-100 dark:border-cyan-800 shadow-sm">
              {product.category}
            </span>
            {product.stock === 0 && (
              <span className="px-2.5 py-1 text-[10px] bg-red-500/90 backdrop-blur-md rounded-lg font-bold tracking-wider text-white shadow-sm">
                Stokta Yok
              </span>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <span className="px-2.5 py-1 text-[10px] bg-orange-500/90 backdrop-blur-md rounded-lg font-bold tracking-wider text-white shadow-sm">
                Son {product.stock} ürün!
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Rating — show real rating if the product has reviews, otherwise an empty state */}
          <div className="flex items-center gap-0.5 mb-3 min-h-[1rem]">
            {product.reviewCount && product.reviewCount > 0 && product.rating ? (
              <>
                {[...Array(5)].map((_, i) => {
                  const filled = i < Math.round(product.rating ?? 0);
                  return (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        filled
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  );
                })}
                <span className="text-xs text-slate-500 ml-2 font-medium">
                  {product.rating.toFixed(1)} ({product.reviewCount} yorum)
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">
                Henüz yorum yok
              </span>
            )}
          </div>

          {/* Product name */}
          <h3 className="text-slate-900 dark:text-white font-bold text-base mb-1.5 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-200 leading-snug">
            {product.name}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto">
            <div>
              <p className="font-mono-price text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                ₺{formatPrice(product.price)}
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                product.stock === 0
                  ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : added
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                  : 'gradient-brand text-white hover:opacity-90 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25'
              }`}
            >
              {product.stock === 0 ? (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Stokta Yok
                </>
              ) : added ? (
                <>
                  <Check className="w-4 h-4" />
                  Eklendi!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Sepete Ekle
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
