'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  ArrowLeft,
  Shield,
  Menu,
  X,
} from 'lucide-react';

const NAV = [
  { href: '/admin',          label: 'Genel Bakış',  icon: LayoutDashboard, exact: true  },
  { href: '/admin/products', label: 'Ürünler',       icon: Package,         exact: false },
  { href: '/admin/orders',   label: 'Siparişler',    icon: ShoppingBag,     exact: false },
  { href: '/admin/users',    label: 'Kullanıcılar',  icon: Users,           exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.role === 'admin';
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  // Prevent background scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Non-admins get no shell — each page handles its own redirect/access-denied.
  if (!isAdmin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Hamburger button (always visible, fixed top-left) ── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Menüyü Aç"
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Backdrop (kept in DOM; fades in/out) ── */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── Sidebar drawer (kept in DOM; slides in/out) ── */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand + close button */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                Snap<span className="text-gradient">Buy</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Yönetici Paneli
              </p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Menüyü Kapat"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3 flex flex-col gap-1 overflow-y-auto flex-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'gradient-brand text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to storefront */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Siteye Dön
          </Link>
        </div>
      </aside>

      {/* ── Content (full width; pt-20 clears the fixed hamburger button) ── */}
      <main className="min-w-0 px-4 sm:px-6 lg:px-10 pt-20 pb-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
