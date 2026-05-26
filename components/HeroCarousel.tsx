'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Star, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';

// ── Featured slides pulled from real product data ─────────────────────────────
const slides = [
  {
    id: 1,
    tag: 'Elektronik',
    title: 'Wireless Noise-Cancelling Headphones',
    subtitle: 'Premium over-ear headphones with active noise cancellation and 30-hour battery life.',
    price: '₺199.99',
    originalPrice: '₺279.99',
    rating: 4.8,
    reviews: 2341,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&h=900&fit=crop',
    href: '/product/3',
    accentFrom: '#06b6d4',
    accentTo: '#3b82f6',
  },
  {
    id: 2,
    tag: 'Elektronik',
    title: 'Smartphone Pro Max',
    subtitle: 'Latest flagship smartphone with a 6.7-inch OLED display and a triple-camera system.',
    price: '₺999.99',
    originalPrice: '₺1,199.99',
    rating: 4.9,
    reviews: 5872,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1600&h=900&fit=crop',
    href: '/product/12',
    accentFrom: '#8b5cf6',
    accentTo: '#6366f1',
  },
  {
    id: 3,
    tag: 'Elektronik',
    title: 'Ultra-Slim Laptop 15 inch',
    subtitle: 'Powerful 15-inch laptop with M2 chip and Retina display crafted for professionals.',
    price: '₺1,299.99',
    originalPrice: '₺1,599.99',
    rating: 4.7,
    reviews: 1988,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1600&h=900&fit=crop',
    href: '/product/4',
    accentFrom: '#3b82f6',
    accentTo: '#06b6d4',
  },
  {
    id: 4,
    tag: 'Elektronik',
    title: 'Professional DSLR Camera',
    subtitle: 'Full-frame DSLR camera with 24.2MP sensor and 4K video recording for creators.',
    price: '₺899.99',
    originalPrice: '₺1,149.99',
    rating: 4.8,
    reviews: 3210,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1600&h=900&fit=crop',
    href: '/product/7',
    accentFrom: '#f59e0b',
    accentTo: '#ef4444',
  },
  {
    id: 5,
    tag: 'Aksesuar',
    title: 'Classic Analog Wristwatch',
    subtitle: 'Elegant stainless steel watch with leather strap and Swiss movement for timeless style.',
    price: '₺249.99',
    originalPrice: '₺349.99',
    rating: 4.9,
    reviews: 4120,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&h=900&fit=crop',
    href: '/product/5',
    accentFrom: '#10b981',
    accentTo: '#14b8a6',
  },
];

const INTERVAL = 5500;

interface HeroCarouselProps {
  products?: Product[];
}

export default function HeroCarousel({ products = [] }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getSlideHref = (s: typeof slides[number]) => {
    const matchingProduct = products.find(
      (p) => p.name.toLowerCase() === s.title.toLowerCase(),
    );
    return matchingProduct ? `/product/${matchingProduct.id}` : s.href;
  };

  const goTo = useCallback(
    (index: number) => {
      if (animating || index === current) return;
      setAnimating(true);
      setCurrent(index);
      setTimeout(() => setAnimating(false), 600);
    },
    [animating, current],
  );

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, goTo]);

  const prev_ = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    autoRef.current = setInterval(next, INTERVAL);
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [next, paused]);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev_();
    }
    setTouchStart(null);
  };

  const slide = slides[current];
  const discount = slide.originalPrice
    ? Math.round(
        (1 -
          parseFloat(slide.price.replace(/[₺,]/g, '')) /
            parseFloat(slide.originalPrice.replace(/[₺,]/g, ''))) *
          100,
      )
    : 0;

  return (
    <div
      className="relative w-full overflow-hidden bg-slate-950"
      style={{ minHeight: '520px', height: 'clamp(520px, 78vh, 760px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Full-bleed slide backgrounds (crossfade + slow zoom) ── */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={i !== current}
        >
          <Image
            src={s.image}
            alt={s.title}
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover ease-out ${i === current ? 'scale-105' : 'scale-100'}`}
            style={{ transition: 'transform 6000ms ease-out' }}
          />
          {/* Readability scrims */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
        </div>
      ))}

      {/* ── Content overlay ── */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex items-center">
        <div key={current} className="max-w-xl animate-fade-in-up">
          {/* Category badge */}
          <span
            className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest text-white shadow-lg mb-5"
            style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}
          >
            {slide.tag}
          </span>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-[1.05] text-white mb-5 tracking-tight drop-shadow-xl">
            {slide.title}
          </h1>

          {/* Subtitle */}
          <p className="text-slate-200 text-base sm:text-lg leading-relaxed mb-7 max-w-lg drop-shadow-md">
            {slide.subtitle}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-7">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4"
                  fill={i < Math.floor(slide.rating) ? '#fbbf24' : 'transparent'}
                  style={{ color: '#fbbf24' }}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-white">{slide.rating}</span>
            <span className="text-sm text-slate-300">
              ({slide.reviews.toLocaleString()} yorum)
            </span>
          </div>

          {/* Price + CTA */}
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-md">
                {slide.price}
              </span>
              {slide.originalPrice && (
                <>
                  <span className="text-base text-slate-400 line-through">
                    {slide.originalPrice}
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}
                  >
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            <Link
              href={getSlideHref(slide)}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-white font-semibold text-sm shadow-xl transition-all duration-300 hover:scale-105 hover:brightness-110"
              style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}
            >
              <ShoppingBag className="w-4 h-4" />
              Hemen Al
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Navigation arrows ── */}
      <button
        onClick={prev_}
        className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all"
        aria-label="Önceki"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all"
        aria-label="Sonraki"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* ── Dot indicators ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            aria-label={`${i + 1}. slayt`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
