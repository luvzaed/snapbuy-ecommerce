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
      <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-cyan-300 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
        {/* Image container */}
        <div className="relative h-52 overflow-hidden bg-slate-50">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Subtle light overlay instead of the old dark one */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />

          {/* Category badge */}
          <span className="absolute top-3 left-3 px-2.5 py-1 text-xs bg-white/90 backdrop-blur-md text-cyan-700 font-bold rounded-lg border border-cyan-100 shadow-sm">
            {product.category}
          </span>

          {/* Price tag floating */}
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm">
            <span className="text-slate-900 font-bold text-sm">
              ${product.price.toFixed(2)}
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
              (128 reviews)
            </span>
          </div>

          {/* Product name */}
          <h3 className="text-slate-900 font-bold text-base mb-1.5 group-hover:text-cyan-600 transition-colors duration-200 leading-snug">
            {product.name}
          </h3>
          <p className="text-slate-500 text-sm mb-5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 mt-auto">
            <div>
              <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                ${product.price.toFixed(2)}
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
                  Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
