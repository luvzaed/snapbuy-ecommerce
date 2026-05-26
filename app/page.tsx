'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import HeroCarousel from '@/components/HeroCarousel';
import { Product } from '@/lib/types';
import {
  Smartphone,
  Home as HomeIcon,
  Dumbbell,
  Footprints,
  Sparkles,
  Watch,
  Package,
  type LucideIcon,
} from 'lucide-react';

// Map a category name (TR or EN) to an icon + accent gradient
const CATEGORY_ICONS: { match: string[]; icon: LucideIcon; color: string }[] = [
  { match: ['elektronik', 'electronic', 'tech', 'teknoloji'], icon: Smartphone, color: 'from-cyan-500 to-blue-600' },
  { match: ['home', 'kitchen', 'ev', 'mutfak'], icon: HomeIcon, color: 'from-amber-500 to-orange-600' },
  { match: ['sport', 'spor', 'fitness'], icon: Dumbbell, color: 'from-emerald-500 to-teal-600' },
  { match: ['footwear', 'shoe', 'ayakkab'], icon: Footprints, color: 'from-rose-500 to-pink-600' },
  { match: ['beauty', 'guzellik', 'güzellik', 'cosmet', 'kozmet'], icon: Sparkles, color: 'from-fuchsia-500 to-purple-600' },
  { match: ['accessor', 'aksesuar', 'watch', 'saat'], icon: Watch, color: 'from-violet-500 to-indigo-600' },
];

function categoryIcon(category: string): { icon: LucideIcon; color: string } {
  const c = category.toLowerCase();
  const found = CATEGORY_ICONS.find((e) => e.match.some((m) => c.includes(m)));
  return found ?? { icon: Package, color: 'from-slate-500 to-slate-600' };
}

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

  // Unique categories pulled from the catalog
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean)),
  ) as string[];

  return (
    <div>
      {/* ── Hero Carousel ──────────────────────────────────────── */}
      <HeroCarousel products={products} />

      {/* ── Categories ─────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-light border-cyan-500/20 text-cyan-500 dark:text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
              Kategoriler
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Kategoriye Göz At
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => {
              const { icon: Icon, color } = categoryIcon(cat);
              return (
                <Link
                  key={cat}
                  href={`/shop?category=${encodeURIComponent(cat)}`}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 text-center capitalize group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {cat}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Products ───────────────────────────────────────────── */}
      <section
        id="products"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
      >
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-light border-cyan-500/20 text-cyan-500 dark:text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Öne Çıkan Koleksiyon
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            En İyi <span className="text-gradient">Ürünler</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Premium kataloğumuzdan özenle seçilmiş, dünya çapında binlerce
            müşteri tarafından sevilen ürünler.
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
              Ürün Bulunamadı
            </h3>
            <p className="text-slate-500">
              Mağazanız şu anda boş. İlk ürününüzü eklemek için yönetici
              paneline gidin!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
