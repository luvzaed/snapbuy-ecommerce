'use client';

import { Product } from '@/lib/types';
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

          {/* Category badge */}
          <span className="absolute top-3 left-3 px-2.5 py-1 text-xs bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-cyan-700 dark:text-cyan-400 font-bold rounded-lg border border-cyan-100 dark:border-cyan-800 shadow-sm">
            {product.category}
          </span>

          {/* Price tag floating */}
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-slate-900 dark:text-white font-bold text-sm">
              ₺{product.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Stars */}
          <div className="flex items-center gap-0.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-xs text-slate-500 ml-2 font-medium">
              (128 yorum)
            </span>
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
              <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                ₺{product.price.toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                added
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                  : 'gradient-brand text-white hover:opacity-90 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25'
              }`}
            >
              {added ? (
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
