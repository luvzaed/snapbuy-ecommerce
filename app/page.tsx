'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import HeroCarousel from '@/components/HeroCarousel';
import { Product } from '@/lib/types';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        // Strong protection here: ensure data is an array, otherwise set an empty array
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        // In case of server connection failure
        setProducts([]);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* ── Hero Carousel ──────────────────────────────────────── */}
      <HeroCarousel />

      {/* ── Products ───────────────────────────────────────────── */}
      <section
        id="products"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
      >
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-light border-cyan-500/20 text-cyan-500 dark:text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Featured Collection
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Top <span className="text-gradient">Products</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Handpicked favorites from our premium catalog, loved by thousands of
            customers worldwide.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl h-80 skeleton border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => (
              <div
                key={product.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          /* Fallback message when store is empty */
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
              No Products Found
            </h3>
            <p className="text-slate-500">
              Your store is currently empty. Head over to the admin panel to add
              your first product!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}