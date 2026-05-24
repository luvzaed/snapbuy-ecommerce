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
    badge: 'New Arrival',
    badgeColor: 'from-cyan-500 to-blue-500',
    tag: 'Electronics',
    title: 'Wireless Noise-Cancelling Headphones',
    subtitle: 'Premium over-ear headphones with active noise cancellation and 30-hour battery life.',
    price: '$199.99',
    originalPrice: '$279.99',
    rating: 4.8,
    reviews: 2341,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&h=700&fit=crop',
    href: '/product/3',
    accentFrom: '#06b6d4',
    accentTo: '#3b82f6',
    bgLight: 'from-cyan-50 via-sky-50 to-blue-50',
    bgDark: 'dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950',
    orbColor: 'rgba(6,182,212,0.18)',
    orbColor2: 'rgba(59,130,246,0.12)',
  },
  {
    id: 2,
    badge: 'Best Seller',
    badgeColor: 'from-violet-500 to-purple-600',
    tag: 'Electronics',
    title: 'Smartphone Pro Max',
    subtitle: 'Latest flagship smartphone with a 6.7-inch OLED display and a triple-camera system.',
    price: '$999.99',
    originalPrice: '$1,199.99',
    rating: 4.9,
    reviews: 5872,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&h=700&fit=crop',
    href: '/product/12',
    accentFrom: '#8b5cf6',
    accentTo: '#6366f1',
    bgLight: 'from-violet-50 via-purple-50 to-indigo-50',
    bgDark: 'dark:from-slate-950 dark:via-slate-900 dark:to-violet-950',
    orbColor: 'rgba(139,92,246,0.18)',
    orbColor2: 'rgba(99,102,241,0.12)',
  },
  {
    id: 3,
    badge: 'Top Rated',
    badgeColor: 'from-blue-500 to-cyan-400',
    tag: 'Electronics',
    title: 'Ultra-Slim Laptop 15 inch',
    subtitle: 'Powerful 15-inch laptop with M2 chip and Retina display crafted for professionals.',
    price: '$1,299.99',
    originalPrice: '$1,599.99',
    rating: 4.7,
    reviews: 1988,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700&h=700&fit=crop',
    href: '/product/4',
    accentFrom: '#3b82f6',
    accentTo: '#06b6d4',
    bgLight: 'from-blue-50 via-sky-50 to-cyan-50',
    bgDark: 'dark:from-slate-950 dark:via-slate-900 dark:to-blue-950',
    orbColor: 'rgba(59,130,246,0.18)',
    orbColor2: 'rgba(6,182,212,0.12)',
  },
  {
    id: 4,
    badge: 'Hot Deal',
    badgeColor: 'from-amber-500 to-orange-500',
    tag: 'Electronics',
    title: 'Professional DSLR Camera',
    subtitle: 'Full-frame DSLR camera with 24.2MP sensor and 4K video recording for creators.',
    price: '$899.99',
    originalPrice: '$1,149.99',
    rating: 4.8,
    reviews: 3210,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=700&h=700&fit=crop',
    href: '/product/7',
    accentFrom: '#f59e0b',
    accentTo: '#ef4444',
    bgLight: 'from-amber-50 via-orange-50 to-red-50',
    bgDark: 'dark:from-slate-950 dark:via-slate-900 dark:to-amber-950',
    orbColor: 'rgba(245,158,11,0.18)',
    orbColor2: 'rgba(239,68,68,0.12)',
  },
  {
    id: 5,
    badge: 'Premium',
    badgeColor: 'from-emerald-500 to-teal-500',
    tag: 'Accessories',
    title: 'Classic Analog Wristwatch',
    subtitle: 'Elegant stainless steel watch with leather strap and Swiss movement for timeless style.',
    price: '$249.99',
    originalPrice: '$349.99',
    rating: 4.9,
    reviews: 4120,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&h=700&fit=crop',
    href: '/product/5',
    accentFrom: '#10b981',
    accentTo: '#14b8a6',
    bgLight: 'from-emerald-50 via-teal-50 to-green-50',
    bgDark: 'dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950',
    orbColor: 'rgba(16,185,129,0.18)',
    orbColor2: 'rgba(20,184,166,0.12)',
  },
];

const INTERVAL = 5500;

interface HeroCarouselProps {
  products?: Product[];
}

export default function HeroCarousel({ products = [] }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getSlideHref = (s: typeof slides[number]) => {
    const matchingProduct = products.find(
      (p) => p.name.toLowerCase() === s.title.toLowerCase()
    );
    return matchingProduct ? `/product/${matchingProduct.id}` : s.href;
  };

  const goTo = useCallback((index: number, dir: 'next' | 'prev') => {
    if (animating || index === current) return;
    setDirection(dir);
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => {
      setAnimating(false);
    }, 600);
  }, [animating, current]);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length, 'next');
  }, [current, goTo]);

  const prev_ = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length, 'prev');
  }, [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    autoRef.current = setInterval(next, INTERVAL);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [next, paused]);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        next();
      } else {
        prev_();
      }
    }
    setTouchStart(null);
  };

  const slide = slides[current];
  const discount = slide.originalPrice
    ? Math.round((1 - parseFloat(slide.price.replace(/[$,]/g, '')) / parseFloat(slide.originalPrice.replace(/[$,]/g, ''))) * 100)
    : 0;

  return (
    <div
      className={`hero-carousel relative w-full overflow-hidden bg-gradient-to-br ${slide.bgLight} ${slide.bgDark}`}
      style={{ minHeight: '580px', height: 'clamp(580px, 80vh, 800px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Animated gradient orbs ── */}
      <div className="hero-orbs-container" aria-hidden>
        <div
          className="hero-orb hero-orb-1"
          style={{ background: `radial-gradient(circle, ${slide.orbColor} 0%, transparent 70%)` }}
        />
        <div
          className="hero-orb hero-orb-2"
          style={{ background: `radial-gradient(circle, ${slide.orbColor2} 0%, transparent 70%)` }}
        />
        <div className="hero-orb hero-orb-3" style={{ background: `radial-gradient(circle, ${slide.orbColor} 0%, transparent 70%)` }} />
      </div>

      {/* ── Dot grid ── */}
      <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" aria-hidden />

      {/* ── Slide content ── */}
      <div className="hero-slide-wrapper relative z-10 w-full h-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div
          key={current}
          className={`hero-slide-enter-${direction} w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-0 items-center`}
        >
          {/* ── Left: Text ── */}
          <div className="hero-text flex flex-col justify-center py-12 lg:py-0 pr-0 lg:pr-12 order-2 lg:order-1">
            {/* Category Badge */}
            <div className="flex items-center gap-2 mb-5">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}
              >
                {slide.tag}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white mb-4 tracking-tight">
              {slide.title.split(' ').slice(0, -1).join(' ')}{' '}
              <span
                style={{
                  background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {slide.title.split(' ').slice(-1)[0]}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed mb-6 max-w-lg">
              {slide.subtitle}
            </p>



            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4"
                    fill={i < Math.floor(slide.rating) ? slide.accentFrom : 'transparent'}
                    style={{ color: slide.accentFrom }}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{slide.rating}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">({slide.reviews.toLocaleString()} reviews)</span>
            </div>

            {/* Price + CTA */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{slide.price}</span>
                {slide.originalPrice && (
                  <>
                    <span className="text-base text-slate-400 line-through">{slide.originalPrice}</span>
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
                className="hero-cta-btn inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-white font-semibold text-sm shadow-lg transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`,
                  boxShadow: `0 8px 32px ${slide.orbColor}`,
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>


          </div>

          {/* ── Right: Product image ── */}
          <div className="hero-image-panel flex items-center justify-center relative order-1 lg:order-2 pt-8 lg:pt-0">
            {/* Glow behind image */}
            <div
              className="absolute inset-0 hero-image-glow"
              style={{
                background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${slide.orbColor} 0%, transparent 70%)`,
              }}
              aria-hidden
            />





            {/* Product image */}
            <Link href={getSlideHref(slide)} className="hero-product-img relative w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] lg:w-[400px] lg:h-[400px] xl:w-[460px] xl:h-[460px] block cursor-pointer">
              <div
                className="absolute inset-0 rounded-[40px] hero-img-ring"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}33, ${slide.accentTo}22)` }}
              />
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-contain drop-shadow-2xl hero-img-float"
                sizes="(max-width: 768px) 260px, (max-width: 1024px) 340px, 460px"
                priority
              />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Navigation arrows ── */}
      <button
        onClick={prev_}
        className="hero-nav-btn absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="hero-nav-btn absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* ── Bottom controls ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3">
        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i, i > current ? 'next' : 'prev')}
              className={`hero-dot ${i === current ? 'hero-dot-active' : ''}`}
              aria-label={`Go to slide ${i + 1}`}
              style={i === current ? { background: `linear-gradient(90deg, ${slide.accentFrom}, ${slide.accentTo})` } : {}}
            />
          ))}
        </div>


      </div>


    </div>
  );
}