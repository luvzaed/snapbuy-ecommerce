'use client';

import { Product } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Check } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BestSellersProps {
  products: Product[];
  loading: boolean;
}

export default function BestSellers({ products, loading }: BestSellersProps) {
  const { addToCart } = useAuth();
  const [addedId, setAddedId] = useState<number | null>(null);

  // Take top 8 products sorted by reviewCount
  const originalItems = [...products]
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, 8);

  // Duplicate items for seamless continuous looping marquee
  const bestSellers = [...originalItems, ...originalItems];

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1600);
  };

  if (!loading && originalItems.length === 0) {
    return null;
  }

  return (
    <section className="relative py-16 bg-slate-50/50 dark:bg-slate-900/10 border-y border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
      {/* CSS Keyframes for Infinite Marquee Ticker & Gentle Bobbing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee-infinite {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-track {
          display: flex;
          gap: 24px; /* gap-6 */
          width: max-content;
          animation: marquee-infinite 30s linear infinite;
        }
        .animate-marquee-track:hover {
          animation-play-state: paused;
        }
        
        @keyframes float-air {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float-p0 { animation: float-air 5s ease-in-out infinite; }
        .animate-float-p1 { animation: float-air 5s ease-in-out infinite 1.2s; }
        .animate-float-p2 { animation: float-air 5s ease-in-out infinite 2.4s; }
        .animate-float-p3 { animation: float-air 5s ease-in-out infinite 3.6s; }
      `}} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-light dark:glass-dark border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider mb-2">
            ×Ÿ”× Popüler Ürünler
          </div>
          <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight uppercase">
            Çok Satan <span className="text-gradient">En İyiler</span>
          </h2>
        </div>

        {loading ? (
          /* Skeletons */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[380px] skeleton rounded-xl" />
            ))}
          </div>
        ) : (
          /* Marquee Container (Overflow Hidden, Slides Non-Stop) */
          <div className="relative overflow-hidden w-full py-4">
            
            {/* The Infinite Scrolling Track */}
            <div className="animate-marquee-track">
              {bestSellers.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="w-[260px] flex-shrink-0"
                >
                  <Link href={`/product/${item.id}`} className="block h-full">
                    {/* Floating Card with Lift Hover and Deep Shadow */}
                    <div className="group relative flex flex-col justify-between items-center text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-[0_20px_35px_rgba(15,46,89,0.12)] hover:-translate-y-3 hover:border-cyan-500/20 transition-all duration-500 ease-out w-full h-[386px]">
                      
                      {/* Centered Image with Staggered Bobbing Animation */}
                      <div className={`relative w-full aspect-square max-h-40 overflow-hidden bg-slate-50/50 dark:bg-slate-800/40 rounded-lg flex items-center justify-center p-2 animate-float-p${idx % 4}`}>
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="200px"
                          className="object-contain transition-transform duration-500 group-hover:scale-106 p-1"
                        />
                      </div>

                      {/* Text Content */}
                      <div className="mt-4 flex flex-col items-center flex-1 w-full justify-center">
                        {/* Title */}
                        <h4 className="text-slate-900 dark:text-white font-extrabold text-sm tracking-wide line-clamp-1 leading-snug uppercase group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors w-full">
                          {item.name}
                        </h4>

                        {/* Price */}
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                          ₺{item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        
                        {/* Short desc */}
                        <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-1 mt-1.5 w-full leading-normal px-2">
                          {item.description}
                        </p>
                      </div>

                      {/* SHOP NOW CTA Button */}
                      <div className="mt-4 w-full">
                        <button
                          onClick={(e) => handleAddToCart(e, item)}
                          className={`w-full py-2.5 px-4 text-xs font-black uppercase tracking-wider rounded transition-all duration-300 hover:scale-[1.02] shadow-sm ${
                            addedId === item.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#0f2e59] dark:bg-cyan-750 text-white hover:bg-slate-900 dark:hover:bg-cyan-600'
                          }`}
                        >
                          {addedId === item.id ? (
                            <span className="flex items-center justify-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Eklendi
                            </span>
                          ) : (
                            'SHOP NOW'
                          )}
                        </button>
                      </div>

                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

