'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface OverviewOrder {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  user?: { name: string | null; email: string };
}

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Beklemede', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  PROCESSING: { label: 'Hazırlanıyor', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  SHIPPED: { label: 'Kargoda', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  DELIVERED: { label: 'Teslim Edildi', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  CANCELLED: { label: 'İptal', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

function statusBadge(s: string) {
  return (
    STATUS[s?.toUpperCase()] ?? {
      label: s,
      cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    }
  );
}

const money = (n: number) =>
  `₺${Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, users: 0 });
  const [recent, setRecent] = useState<OverviewOrder[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, oRes, uRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/orders?all=true'),
          fetch('/api/users'),
        ]);
        const products = pRes.ok ? await pRes.json() : [];
        const orders = oRes.ok ? await oRes.json() : [];
        const users = uRes.ok ? await uRes.json() : [];
        const productsArr = Array.isArray(products) ? products : [];
        const ordersArr: OverviewOrder[] = Array.isArray(orders) ? orders : [];
        const usersArr = Array.isArray(users) ? users : [];
        const revenue = ordersArr.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        setStats({
          products: productsArr.length,
          orders: ordersArr.length,
          revenue,
          users: usersArr.length,
        });
        const sorted = [...ordersArr].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setRecent(sorted.slice(0, 6));
      } catch (e) {
        console.error('Overview load failed:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user || user.role !== 'admin') return null;

  const cards = [
    { label: 'Toplam Ürün', value: stats.products.toLocaleString('tr-TR'), icon: Package, color: 'from-cyan-500 to-blue-600' },
    { label: 'Toplam Sipariş', value: stats.orders.toLocaleString('tr-TR'), icon: ShoppingBag, color: 'from-violet-500 to-purple-600' },
    { label: 'Toplam Gelir', value: money(stats.revenue), icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
    { label: 'Toplam Kullanıcı', value: stats.users.toLocaleString('tr-TR'), icon: Users, color: 'from-amber-500 to-orange-600' },
  ];

  const quickLinks = [
    { href: '/admin/products', label: 'Ürün Ekle / Düzenle', icon: Plus },
    { href: '/admin/orders', label: 'Siparişleri Yönet', icon: ShoppingBag },
    { href: '/admin/users', label: 'Kullanıcıları Yönet', icon: Users },
  ];

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Genel Bakış
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Hoş geldin{user.name ? `, ${user.name}` : ''} — mağazanın özeti
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm"
            >
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-md mb-4`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              {loading ? (
                <div className="h-7 w-24 rounded-md skeleton" />
              ) : (
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {c.value}
                </p>
              )}
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Son Siparişler
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Tümü <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl skeleton" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
              Henüz sipariş yok.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((o) => {
                const s = statusBadge(o.status);
                return (
                  <Link
                    href="/admin/orders"
                    key={o.id}
                    className="flex items-center justify-between gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">#{o.id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {o.user?.name || o.user?.email || 'Müşteri'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${s.cls}`}>
                        {s.label}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                        {money(o.total)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Hızlı İşlemler</h2>
          <div className="flex flex-col gap-2.5">
            {quickLinks.map((q) => {
              const Icon = q.icon;
              return (
                <Link
                  key={q.href}
                  href={q.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-sm transition-all group"
                >
                  <Icon className="w-4 h-4 text-indigo-500" />
                  {q.label}
                  <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
