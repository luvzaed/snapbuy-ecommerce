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
    <div className="pb-20">
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
