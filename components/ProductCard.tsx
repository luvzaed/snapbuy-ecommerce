'use client';

import { Product } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { ShoppingCart, Star, Check } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link'; // أضفنا هذي عشان الروابط

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useAuth();
  const [added, setAdded] = useState(false);

  // استقبلنا الـ Event هنا عشان نمنع تداخل الضغطات
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // هذا الأمر يمنع الكرت من نقلك لصفحة المنتج لما تضغط على زر الإضافة للسلة
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    // غلفنا الكرت كامل بالـ Link عشان يصير كله قابل للضغط
    <Link href={`/product/${product.id}`} className="block">
      <div className="group relative gradient-card rounded-2xl overflow-hidden border border-white/[0.07] hover:border-cyan-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 glow-hover">
        {/* Image container */}
        <div className="relative h-52 overflow-hidden bg-[#0a0f1e]">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1424] via-[#0d1424]/20 to-transparent" />

          {/* Category badge */}
          <span className="absolute top-3 left-3 px-2.5 py-1 text-xs glass text-cyan-300 font-medium rounded-lg border-cyan-500/20">
            {product.category}
          </span>

          {/* Price tag floating */}
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg glass border-white/10">
            <span className="text-white font-bold text-sm">
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
            <span className="text-xs text-slate-600 ml-2">(128 reviews)</span>
          </div>

          {/* Product name */}
          <h3 className="text-white font-semibold text-base mb-1.5 group-hover:text-cyan-300 transition-colors duration-200 leading-snug">
            {product.name}
          </h3>
          <p className="text-slate-500 text-sm mb-5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xl font-bold text-gradient">
                ${product.price.toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                added
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
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
