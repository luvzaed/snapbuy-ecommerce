'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import VisualSearch from '@/components/VisualSearch';
import { Product } from '@/lib/types';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
  Sparkles,
  ScanSearch,
} from 'lucide-react';
import Link from 'next/link';

const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On all orders over $50' },
  {
    icon: ShieldCheck,
    title: 'Secure Payment',
    desc: '256-bit SSL encryption',
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    desc: '30-day hassle-free returns',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    desc: 'Expert help around the clock',
  },
];

const stats = [
  { value: '50K+', label: 'Happy Customers' },
  { value: '2,400+', label: 'Products' },
  { value: '4.9★', label: 'Avg. Rating' },
  { value: '99%', label: 'Satisfaction' },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [visualSearchOpen, setVisualSearchOpen] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        // حماية قوية هنا: نتأكد إن البيانات عبارة عن مصفوفة، وإلا نعطيه مصفوفة فارغة
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        setProducts([]); // في حال فشل الاتصال بالسيرفر
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center wave-bg overflow-hidden dot-grid">
        {/* ── Animated wave SVG layers ── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-[1] pointer-events-none"
          style={{ height: '180px' }}
        >
          {/* Wave 1 */}
          <div
            className="absolute bottom-0 animate-wave-1"
            style={{ width: '200%', height: '100%' }}
          >
            <svg
              viewBox="0 0 1440 180"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0,60 C240,130 480,-10 720,60 C960,130 1200,-10 1440,60 L1440,180 L0,180 Z"
                fill="rgba(6,182,212,0.04)"
              />
            </svg>
          </div>
          {/* Wave 2 */}
          <div
            className="absolute bottom-0 animate-wave-2"
            style={{ width: '200%', height: '80%' }}
          >
            <svg
              viewBox="0 0 1440 140"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0,40 C360,120 720,-20 1080,40 C1260,80 1380,20 1440,40 L1440,140 L0,140 Z"
                fill="rgba(59,130,246,0.06)"
              />
            </svg>
          </div>
          {/* Wave 3 */}
          <div
            className="absolute bottom-0 animate-wave-1"
            style={{ width: '200%', height: '55%', animationDuration: '14s' }}
          >
            <svg
              viewBox="0 0 1440 100"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0,30 C180,70 360,0 540,30 C720,60 900,0 1080,30 C1260,60 1380,10 1440,30 L1440,100 L0,100 Z"
                fill="rgba(139,92,246,0.05)"
              />
            </svg>
          </div>
        </div>

        {/* Ambient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.06] rounded-full blur-[120px] animate-float" />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/[0.08] rounded-full blur-[100px] animate-float"
          style={{ animationDelay: '2s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-violet-600/[0.05] rounded-full blur-[80px]" />

        {/* Horizontal line accent */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white mb-6 leading-[1.05] tracking-tight animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            Tech That <span className="text-gradient">Elevates</span>
            <br className="hidden sm:block" /> Your World
          </h1>

          {/* Sub */}
          <p
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            Discover premium electronics, cutting-edge wearables, and next-gen
            gaming gear — all curated for the modern tech enthusiast.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <a
              href="#products"
              className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl gradient-brand text-white font-semibold text-base hover:opacity-90 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-300"
            >
              Shop Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <button
              onClick={() => setVisualSearchOpen(true)}
              className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl glass border-white/10 text-white font-semibold text-base hover:border-cyan-500/40 hover:bg-cyan-500/[0.08] transition-all duration-300"
            >
              <ScanSearch className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              Visual Search
            </button>
            <Link
              href="/register"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl glass border-white/10 text-white font-semibold text-base hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-300"
            >
              Create Account
            </Link>
          </div>

          {/* Stats row */}
          <div
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto animate-fade-in-up"
            style={{ animationDelay: '0.45s' }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="glass rounded-2xl px-4 py-4 border-white/[0.06]"
              >
                <p className="text-2xl font-bold text-gradient">{s.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Search Modal */}
      {visualSearchOpen && (
        <VisualSearch onClose={() => setVisualSearchOpen(false)} />
      )}

      {/* ── Features Bar ───────────────────────────────────────── */}
      <section className="border-y border-white/[0.07] bg-[#0a0f1e]/80 py-8 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl glass-light flex items-center justify-center group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 transition-all duration-200 flex-shrink-0">
                  <f.icon className="w-4.5 h-4.5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{f.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products ───────────────────────────────────────────── */}
      <section
        id="products"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
      >
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-light border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Featured Collection
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Top <span className="text-gradient">Products</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
            Handpicked favorites from our premium catalog, loved by thousands of
            customers worldwide.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl h-80 skeleton border border-white/[0.05]"
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
          /* هذي الرسالة اللي بتطلع بدال الإيرور لو المتجر فاضي */
          <div className="text-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
            <h3 className="text-2xl font-bold text-white mb-3">
              No Products Found
            </h3>
            <p className="text-slate-400">
              Your store is currently empty. Head over to the admin panel to add
              your first product!
            </p>
          </div>
        )}
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 gradient-brand opacity-10" />
          <div className="absolute inset-0 dot-grid opacity-40" />
          <div className="absolute inset-px rounded-3xl border border-white/10" />
          {/* Top edge glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

          <div className="relative z-10 glass rounded-3xl p-12 sm:p-20 text-center border-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-light border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-6">
              <Sparkles className="w-3 h-3" />
              Limited Offer
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Join <span className="text-gradient">50,000+</span> Happy
              Customers
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Sign up today and get{' '}
              <strong className="text-white">10% off</strong> your first order.
              No credit card required.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl gradient-brand text-white font-semibold text-base hover:opacity-90 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-300"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
