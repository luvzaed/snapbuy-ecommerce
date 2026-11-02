'use client';

import { useEffect, useState } from 'react';
import HeroCarousel from '@/components/HeroCarousel';
import ProductMarquee from '@/components/ProductMarquee';
import FeaturedCategories from '@/components/FeaturedCategories';
import NewsletterSignup from '@/components/NewsletterSignup';
import { Product } from '@/lib/types';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => {
        if (!r.ok) throw new Error('Product request failed');
        return r.json();
      })
      .then((data) => {
        // Strong protection here: ensure data is an array, otherwise set an empty array
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          throw new Error('Invalid product response');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        // In case of server connection failure
        setProducts([]);
        setLoadError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="pb-20">
      {loadError && (
        <div role="alert" className="mx-auto my-6 max-w-3xl rounded-lg border border-amber-300 bg-amber-50 p-4 text-center text-slate-900 dark:border-amber-800 dark:bg-slate-900 dark:text-slate-100">
          <p>Ürünler şu anda yüklenemiyor. Lütfen tekrar deneyin.</p>
          <button type="button" className="mt-2 underline" onClick={() => window.location.reload()}>Tekrar dene</button>
        </div>
      )}
      {/* ── Hero Carousel ──────────────────────────────────────── */}
      <HeroCarousel products={products} />

      {/* ── Categories ─────────────────────────────────────────── */}
      <FeaturedCategories products={products} />

      {/* ── Marquee slider ─────────────────────────────────────── */}
      <ProductMarquee products={products} loading={loading} />

      {/* ── Newsletter ─────────────────────────────────────────── */}
      <NewsletterSignup />
    </div>
  );
}
