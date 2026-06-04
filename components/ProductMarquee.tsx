'use client';

import { useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/lib/types';

// Map a category to a background key used for the .mq-bg-* classes below.
function bgKey(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('elektronik') || c.includes('electronic') || c.includes('tech')) return 'elektronik';
  if (c.includes('spor') || c.includes('sport') || c.includes('fitness')) return 'spor';
  if (c.includes('aksesuar') || c.includes('accessor')) return 'aksesuar';
  if (c.includes('giyim') || c.includes('fashion') || c.includes('clothing') || c.includes('apparel')) return 'giyim';
  return 'default';
}

// Card slot: 220px wide + 16px gap
const CARD_W = 220;
const GAP    = 16;
const UNIT   = CARD_W + GAP; // 236 px per slot

interface Props {
  products: Product[];
  loading?: boolean;
}

export default function ProductMarquee({ products, loading = false }: Props) {
  // Stable random selection — shuffled once when products load
  const items = useMemo(() => {
    if (!products.length) return [];
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  }, [products]);

  const trackRef  = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);        // current translateX in px
  const pausedRef = useRef(false);    // hover-pause flag
  const rafRef    = useRef<number>(0);

  // Width of one copy of the doubled track; looping resets at this boundary
  const halfWidth = items.length * UNIT;

  // rAF loop — direct DOM mutation avoids React re-renders every frame
  const tick = useCallback(() => {
    if (!pausedRef.current && trackRef.current && halfWidth > 0) {
      // Speed: complete one full loop in ~80 s at 60 fps
      const speed = halfWidth / (80 * 60);
      offsetRef.current += speed;
      if (offsetRef.current >= halfWidth) offsetRef.current -= halfWidth;
      trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [halfWidth]);

  useEffect(() => {
    if (!items.length) return;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick, items.length]);

  // Arrow button: jump one card slot forward or back with a brief smooth transition
  const nudge = useCallback((dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track || halfWidth === 0) return;
    track.style.transition = 'transform 0.35s ease';
    offsetRef.current = ((offsetRef.current + dir * UNIT) % halfWidth + halfWidth) % halfWidth;
    track.style.transform = `translateX(-${offsetRef.current}px)`;
    // Remove transition so the continuous rAF scroll stays smooth
    setTimeout(() => { if (trackRef.current) trackRef.current.style.transition = ''; }, 400);
  }, [halfWidth]);

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="pt-20 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
          <div className="h-4 w-20 skeleton rounded-full mx-auto mb-4" />
          <div className="h-9 w-72 skeleton rounded-xl mx-auto mb-3" />
          <div className="h-4 w-48 skeleton rounded-lg mx-auto" />
        </div>
        <div className="flex gap-4 px-8 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-[220px] flex-shrink-0 h-[280px] skeleton rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  const doubled = [...items, ...items];

  return (
    <section className="pt-20 pb-2">
      {/*
        Per-category pastel gradient for the card banner. Light mode = soft
        tints (so mix-blend-multiply cleanly drops white photo backgrounds).
        Dark mode (.dark) = the original dark gradients.
      */}
      <style>{`
        /* Light pastel image tiles in BOTH themes — mix-blend multiply drops the
           white photo backgrounds cleanly. The card chrome (border) and the
           bottom info panel adapt to dark mode instead, so products stay bright
           and readable on the dark page. */
        .mq-bg-elektronik { background: linear-gradient(150deg, #f0f9ff, #dbeafe); }
        .mq-bg-aksesuar   { background: linear-gradient(150deg, #fffbeb, #fef3c7); }
        .mq-bg-spor       { background: linear-gradient(150deg, #f0fdf4, #dcfce7); }
        .mq-bg-giyim      { background: linear-gradient(150deg, #faf5ff, #ede9fe); }
        .mq-bg-default    { background: linear-gradient(150deg, #f8fafc, #f1f5f9); }
      `}</style>

      {/* ── Section header ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          Ürünleri Keşfet
        </h2>
      </div>

      {/* ── Slider + side arrows ── */}
      <div className="relative">

        {/* Left arrow */}
        <button
          onClick={() => nudge(-1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 shadow-sm flex items-center justify-center text-[#131b2e] dark:text-slate-300 hover:scale-110 hover:shadow-md transition-all duration-200"
          aria-label="Önceki"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => nudge(1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 shadow-sm flex items-center justify-center text-[#131b2e] dark:text-slate-300 hover:scale-110 hover:shadow-md transition-all duration-200"
          aria-label="Sonraki"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* ── Track ── */}
        <div
          className="overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)',
            maskImage:        'linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)',
          }}
          onMouseEnter={() => { pausedRef.current = true;  }}
          onMouseLeave={() => { pausedRef.current = false; }}
        >
          <div ref={trackRef} className="flex gap-4 w-max py-4 px-2">
            {doubled.map((product, idx) => (
              <Link
                key={`${product.id}-${idx}`}
                href={`/product/${product.id}`}
                className="group w-[220px] h-[280px] flex-shrink-0 flex flex-col rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-white/10 shadow-[0_4px_12px_rgba(15,23,42,0.04)] hover:shadow-xl hover:scale-[1.03] transition-all duration-300"
              >
                {/* ── Top (~65%) — pastel gradient, image floats via multiply ── */}
                <div className={`mq-bg-${bgKey(product.category)} relative h-[182px] flex-shrink-0 overflow-hidden`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="mq-img w-full h-full object-contain p-4"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                </div>

                {/* ── Bottom (~35%) — white info panel ── */}
                <div className="flex-1 bg-white dark:bg-slate-900 p-3 flex flex-col justify-center gap-1.5">
                  {/* Category chip */}
                  <span className="self-start px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-800">
                    {product.category}
                  </span>

                  {/* Product name — 1 line */}
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-snug">
                    {product.name}
                  </p>

                  {/* Price — JetBrains Mono numerals, site cyan→blue gradient */}
                  <p className="font-mono-price text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                    ₺{product.price.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
