'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Package, Clock, Truck, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string; border: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Beklemede' },
  PROCESSING: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'İşleniyor' },
  SHIPPED: { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Kargoya Verildi' },
  DELIVERED: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Teslim Edildi' },
};

export default function OrdersPage() {
  const { user, orders, fetchOrders } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-10">
        <Package className="w-7 h-7 text-indigo-500" />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Siparişlerim</h1>
        <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-sm font-medium">
          {orders.length} sipariş
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-16 text-center">
          <Package className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Henüz sipariş yok</h2>
          <p className="text-slate-500 mb-8">Siparişlerinizi burada görmek için alışverişe başlayın</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl gradient-brand text-white font-semibold hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
          >
            Ürünleri İncele <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order, i) => {
            const statusKey = order.status.toUpperCase();
            const s = statusConfig[statusKey] || statusConfig['PENDING'];
            const StatusIcon = s.icon;
            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-slate-900 dark:text-white font-bold text-lg">Sipariş #{order.id}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.color} ${s.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        {s.label}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gradient">₺{order.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-slate-500 text-xs mt-1">Sipariş toplamı</p>
                  </div>
                </div>

                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap gap-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                          {item.product && (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={item.product.image}
                                alt={item.product.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="text-slate-800 text-sm font-medium line-clamp-1">
                              {item.product?.name || 'Ürün'}
                            </p>
                            <p className="text-slate-500 text-xs">
                              Adet: {item.quantity} × ₺{item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

