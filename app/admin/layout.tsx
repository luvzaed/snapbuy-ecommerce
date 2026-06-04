'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  ArrowLeft,
  Shield,
} from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Genel Bakış', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Ürünler', icon: Package, exact: false },
  { href: '/admin/orders', label: 'Siparişler', icon: ShoppingBag, exact: false },
  { href: '/admin/users', label: 'Kullanıcılar', icon: Users, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.role === 'admin';

  // Non-admins (or while auth is still loading) get no shell — each page's own
  // guard handles the redirect / access-denied screen.
  if (!isAdmin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:flex">
      {/* ── Sidebar ── */}
      <aside className="lg:w-64 lg:shrink-0 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 lg:h-screen lg:sticky lg:top-0 lg:flex lg:flex-col">
        {/* Brand */}
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800">
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

        {/* Nav */}
        <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto lg:flex-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
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
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Siteye Dön
          </Link>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-8">{children}</main>
    </div>
  );
}
