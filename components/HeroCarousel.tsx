'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Product } from '@/lib/types';

// ── Slide definitions — product IDs, badge label and subtitle (UNCHANGED) ─────
interface SlideDef {
  productId: number;
  badge: string;
  subtitle: string;
}

const SLIDE_DEFS: SlideDef[] = [
  { productId: 48, badge: 'ELEKTRONİK', subtitle: 'En İyi Akıllı Telefon Deneyimi' },
  { productId: 55, badge: 'ELEKTRONİK', subtitle: 'Oyunda Sınırları Zorla' },
  { productId: 63, badge: 'AKSESUAR', subtitle: 'Tarzını Yansıt' },
  { productId: 58, badge: 'SPOR', subtitle: 'Hedeflerine Ulaş' },
  { productId: 66, badge: 'GİYİM', subtitle: 'Her Anda Rahat Hisset' },
];

interface Slide extends SlideDef {
  product: Product;
}

// Map a category to a background key used for the .hero-bg-* classes below.
function bgKey(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('elektronik') || c.includes('electronic') || c.includes('tech')) return 'elektronik';
  if (c.includes('spor') || c.includes('sport') || c.includes('fitness')) return 'spor';
  if (c.includes('aksesuar') || c.includes('accessor')) return 'aksesuar';
  if (c.includes('giyim') || c.includes('fashion') || c.includes('clothing') || c.includes('apparel')) return 'giyim';
  return 'default';
}

const INTERVAL = 5000;

interface HeroCarouselProps {
  // Passed in from page.tsx — already fetched, no duplicate request needed.
  products?: Product[];
}

export default function HeroCarousel({ products = [] }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build slides at render time; missing product IDs are silently skipped.
  const slides: Slide[] = SLIDE_DEFS.reduce<Slide[]>((acc, def) => {
    const product = products.find((p) => p.id === def.productId);
    if (product) acc.push({ ...def, product });
    return acc;
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-advance — paused on hover, disabled when only 1 slide
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timerRef.current = setInterval(next, INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, paused, slides.length]);

  // 0 slides — hide carousel entirely
  if (slides.length === 0) return null;

  return (
    <>
      {/*
        Per-category backgrounds. Light mode = soft pastel tint.
        Dark mode (.dark) = the original dark gradients, so the carousel still
        looks at home against the site's existing dark navy theme.
      */}
      <style>{`
        .hero-bg-elektronik { background: #f0f9ff; }
        .hero-bg-aksesuar   { background: #fffbeb; }
        .hero-bg-spor       { background: #f0fdf4; }
        .hero-bg-giyim      { background: #faf5ff; }
        .hero-bg-default    { background: #f8fafc; }
        .dark .hero-bg-elektronik { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); }
        .dark .hero-bg-aksesuar   { background: linear-gradient(135deg, #1a1a2e, #3b2f10, #1a1a2e); }
        .dark .hero-bg-spor       { background: linear-gradient(135deg, #0b132b, #134e5e, #0b132b); }
        .dark .hero-bg-giyim      { background: linear-gradient(135deg, #2c3e50, #1f3a5f, #16213e); }
        .dark .hero-bg-default    { background: linear-gradient(135deg, #1a1a2e, #16213e); }
      `}</style>

      <div
        className="relative overflow-hidden rounded-xl shadow-[0_4px_12px_rgba(15,23,42,0.04)] dark:shadow-2xl border border-[#e2e8f0] dark:border-white/10 h-[350px] md:h-[500px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* ── Slide track — translateX drives the slide-in animation ── */}
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((s, idx) => (
            <div
              key={s.productId}
              className={`hero-bg-${bgKey(s.product.category)} w-full h-full flex-shrink-0 flex flex-col md:flex-row items-center`}
            >
              {/* ── Left: text content ── */}
              <div className="md:w-[45%] w-full flex flex-col justify-center px-8 md:px-12 lg:px-16 py-6 md:py-12 gap-3 md:gap-5 order-2 md:order-1 flex-shrink-0">

                {/* Category chip */}
                <span className="self-start px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-800">
                  {s.badge}
                </span>

                {/* Product name */}
                <h2 className="text-[28px] md:text-5xl font-bold leading-tight text-slate-900 dark:text-white max-w-md">
                  {s.product.name}
                </h2>

                {/* Subtitle */}
                <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-xs leading-snug">
                  {s.subtitle}
                </p>

                {/* Price — JetBrains Mono numerals, site cyan→blue gradient */}
                <p className="font-mono-price text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                  ₺{s.product.price.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>

                {/* CTA button — site brand gradient */}
                <Link
                  href={`/product/${s.productId}`}
                  className="self-start inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm text-white gradient-brand transition-all duration-200 hover:brightness-110 hover:scale-105 active:scale-95 shadow-md"
                >
                  Ürünü İncele
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* ── Right: product image floats on the pastel background ── */}
              {/* Radial mask fades the photo's white edges into the slide
                  background so there's no harsh white rectangle. */}
              <div
                className="md:w-[55%] w-full relative md:h-full h-[150px] order-1 md:order-2 flex-shrink-0 overflow-hidden"
                style={{
                  WebkitMaskImage:
                    'radial-gradient(ellipse 88% 88% at 55% 50%, black 45%, transparent 82%)',
                  maskImage:
                    'radial-gradient(ellipse 88% 88% at 55% 50%, black 45%, transparent 82%)',
                }}
              >
                <Image
                  src={s.product.image}
                  alt={s.product.name}
                  fill
                  className="object-contain"
                  style={{
                    padding: '1.5rem',
                    filter: 'drop-shadow(0 18px 40px rgba(15,23,42,0.22))',
                  }}
                  sizes="(max-width: 768px) 100vw, 55vw"
                  priority={idx === 0}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ── Navigation arrows — minimal white circles, hidden when 1 slide ── */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 shadow-sm text-[#131b2e] dark:text-slate-200 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md"
              aria-label="Önceki slayt"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 shadow-sm text-[#131b2e] dark:text-slate-200 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md"
              aria-label="Sonraki slayt"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* ── Dots — gray circles, active = wider teal pill ── */}
        {slides.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.productId}
                onClick={() => setCurrent(i)}
                aria-label={`${i + 1}. slayt`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-7 bg-[#006a6a] dark:bg-cyan-400'
                    : 'w-2 bg-slate-300 dark:bg-white/30 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
