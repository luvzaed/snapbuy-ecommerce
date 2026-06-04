'use client';

import Link from 'next/link';
import {
  Smartphone,
  Home as HomeIcon,
  Dumbbell,
  Footprints,
  Sparkles,
  Watch,
  Shirt,
  Package,
  type LucideIcon,
} from 'lucide-react';
import { Product } from '@/lib/types';

// Map a category (TR or EN) to its icon + light-theme icon chip colors.
// Colors follow the design spec; categories outside the named set fall back
// to the neutral default while still keeping a sensible icon.
function categoryStyle(category: string): {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
} {
  const c = category.toLowerCase();
  if (c.includes('elektronik') || c.includes('electronic') || c.includes('tech') || c.includes('teknoloji'))
    return { icon: Smartphone, iconBg: '#e0fafa', iconColor: '#006a6a' };
  if (c.includes('spor') || c.includes('sport') || c.includes('fitness'))
    return { icon: Dumbbell, iconBg: '#fff7ed', iconColor: '#ea580c' };
  if (c.includes('aksesuar') || c.includes('accessor') || c.includes('watch') || c.includes('saat'))
    return { icon: Watch, iconBg: '#f5f3ff', iconColor: '#7c3aed' };
  if (c.includes('giyim') || c.includes('fashion') || c.includes('clothing') || c.includes('apparel'))
    return { icon: Shirt, iconBg: '#eff6ff', iconColor: '#2563eb' };
  // Unlisted-but-known icons keep a fitting glyph, neutral default colors.
  if (c.includes('home') || c.includes('kitchen') || c.includes('ev') || c.includes('mutfak'))
    return { icon: HomeIcon, iconBg: '#f1f5f9', iconColor: '#475569' };
  if (c.includes('footwear') || c.includes('shoe') || c.includes('ayakkab'))
    return { icon: Footprints, iconBg: '#f1f5f9', iconColor: '#475569' };
  if (c.includes('beauty') || c.includes('guzellik') || c.includes('güzellik') || c.includes('cosmet') || c.includes('kozmet'))
    return { icon: Sparkles, iconBg: '#f1f5f9', iconColor: '#475569' };
  return { icon: Package, iconBg: '#f1f5f9', iconColor: '#475569' };
}

interface Props {
  products: Product[];
}

export default function FeaturedCategories({ products }: Props) {
  // Unique categories pulled from the catalog
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean)),
  ) as string[];

  // Product count per category
  const counts = new Map<string, number>();
  for (const p of products) {
    if (!p.category) continue;
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }

  if (categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
      {/* Section heading */}
      <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight text-center mb-10">
        Kategoriye Göz At
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map((cat, i) => {
          const { icon: Icon, iconBg, iconColor } = categoryStyle(cat);
          const count = counts.get(cat) ?? 0;
          return (
            <Link
              key={cat}
              href={`/shop?category=${encodeURIComponent(cat)}`}
              className="group bg-white dark:bg-slate-900 rounded-xl border border-[#e2e8f0] dark:border-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.04)] p-8 text-center flex flex-col items-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {/* Icon chip — 64px circle */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: iconBg }}
              >
                <Icon className="w-7 h-7" style={{ color: iconColor }} strokeWidth={2.2} />
              </div>

              {/* Category name */}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize mt-4 line-clamp-1">
                {cat}
              </h3>

              {/* Product count */}
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {count} ürün
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
