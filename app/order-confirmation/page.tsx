'use client';

import { useEffect, useState } from 'react';
import { useAuth, AuthOrder, AuthOrderItem } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  ArrowRight,
  Package,
  ShoppingBag,
  Truck,
  Clock,
  ClipboardCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

// Turkish translations + visual config for every order status the API can return.
// Statuses are stored UPPERCASE in the DB; the lookup is case-insensitive below.
const statusDisplay: Record<
  string,
  { label: string; icon: LucideIcon; bg: string; border: string; text: string }
> = {
  PENDING: {
    label: 'Beklemede',
    icon: Clock,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-600 dark:text-amber-400',
  },
  PROCESSING: {
    label: 'Hazırlanıyor',
    icon: Package,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
  },
  SHIPPED: {
    label: 'Kargoya Verildi',
    icon: Truck,
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  DELIVERED: {
    label: 'Teslim Edildi',
    icon: CheckCircle2,
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  CANCELLED: {
    label: 'İptal Edildi',
    icon: XCircle,
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-600 dark:text-rose-400',
  },
};

export default function OrderConfirmationPage() {
  const { user, loading: authLoading, orders, fetchOrders } = useAuth();
  const router = useRouter();
  const [latestOrder, setLatestOrder] = useState<AuthOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch latest orders and grab the most recent one
    const loadOrder = async () => {
      await fetchOrders();
      setLoading(false);
    };
    loadOrder();
  }, [authLoading, user, fetchOrders, router]);

  // Update latest order when orders change
  useEffect(() => {
    if (orders.length > 0) {
      const timer = setTimeout(() => {
        setLatestOrder(orders[0]); // orders are sorted by createdAt desc
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [orders]);

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="w-24 h-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-6 animate-pulse-glow"
          style={{ '--tw-shadow-color': 'rgba(16, 185, 129, 0.3)' } as React.CSSProperties}
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
          Sipariş <span className="text-gradient">Onaylandı!</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto">
          Satın almanız için teşekkürler. Siparişiniz başarıyla oluşturuldu.
        </p>
      </div>

      {/* Order Details Card */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-sm text-center">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Sipariş detayları yükleniyor...</p>
        </div>
      ) : latestOrder ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          {/* Order ID & Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium mb-1">
                Sipariş Numarası
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                #{latestOrder.id}
              </p>
            </div>
            {(() => {
              const s =
                statusDisplay[latestOrder.status?.toUpperCase?.() ?? ''] ??
                statusDisplay.PENDING;
              const StatusIcon = s.icon;
              return (
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border ${s.bg} ${s.border} ${s.text}`}
                >
                  <StatusIcon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{s.label}</span>
                </div>
              );
            })()}
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-indigo-500" />
              Sipariş Edilen Ürünler
            </h3>
            <div className="flex flex-col gap-3">
              {latestOrder.items?.map((item: AuthOrderItem) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700"
                >
                  {item.product && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 dark:text-white text-sm font-medium truncate">
                      {item.product?.name || 'Ürün'}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      Adet: {item.quantity} × ₺{item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <p className="text-slate-900 dark:text-white font-bold text-sm">
                    ₺{(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              Sipariş Toplamı
            </span>
            <span className="text-2xl font-bold text-gradient">
              ₺{latestOrder.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-sm text-center">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Sipariş detayları bulunamadı.</p>
        </div>
      )}

      {/* What happens next */}
      <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">
          Sırada ne var?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center mb-3">
              <ClipboardCheck className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-slate-900 dark:text-white text-sm font-semibold mb-1">Onay</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Siparişiniz başarıyla kaydedildi
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-slate-900 dark:text-white text-sm font-semibold mb-1">İşleniyor</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Ürünleriniz kargo için hazırlanacak
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center mb-3">
              <Truck className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-slate-900 dark:text-white text-sm font-semibold mb-1">Teslimat</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Paketinizi siparişler sayfasından takip edin
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl gradient-brand text-white font-semibold hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
        >
          Siparişlerime Git
          <ArrowRight className="w-5 h-5" />
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          <ShoppingBag className="w-5 h-5" />
          Alışverişe Devam Et
        </Link>
      </div>
    </div>
  );
}

