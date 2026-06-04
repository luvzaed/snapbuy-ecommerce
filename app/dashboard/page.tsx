"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Package, User, CheckCircle2, Clock, Truck, MapPin, type LucideIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const statusConfig: Record<string, { icon: LucideIcon; color: string; bg: string; border: string; label: string }> = {
  pending:    { icon: Clock,        color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", label: "Beklemede"     },
  processing: { icon: Package,      color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/30",   label: "Hazırlanıyor"  },
  shipped:    { icon: Truck,        color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/30", label: "Kargoda"       },
  delivered:  { icon: CheckCircle2, color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/30",  label: "Teslim Edildi" },
};

export default function DashboardPage() {
  const { user, loading, orders, fetchOrders } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center animate-pulse-glow">
          <User className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Siparişlerim</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Sipariş geçmişiniz aşağıda listelenmektedir</p>
        </div>
      </div>

      {/* Orders */}
      <div>
        {orders.length === 0 ? (
          <div className="gradient-card border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 text-lg">Henüz sipariş yok</p>
            <p className="text-slate-500 text-sm mt-1 mb-6">Siparişlerinizi burada görmek için alışverişe başlayın</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-medium hover:scale-105 transition-transform"
            >
              Ürünlere Göz At
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order, i) => {
              // Statuses are stored uppercase in the DB; config keys are lowercase.
              const s = statusConfig[order.status?.toLowerCase()] ?? {
                icon: Clock,
                color: "text-slate-400",
                bg: "bg-slate-400/10",
                border: "border-slate-400/30",
                label: order.status || "Bilinmiyor",
              };

              return (
                <div
                  key={order.id}
                  className="gradient-card border border-slate-200 dark:border-white/10 hover:border-indigo-500/40 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-indigo-500/10 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {/* Top row: order number + status badge + date */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <h3 className="text-slate-900 dark:text-white font-bold text-lg">#{order.id}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.color} ${s.border}`}>
                        <s.icon className="w-3 h-3" />
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                      <MapPin className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}
                    </div>
                  </div>

                  {/* Product mini-cards */}
                  <div className="flex flex-col gap-2 mb-5">
                    {order.items.map((item) => (
                      <div
                        key={item.id ?? item.product.id}
                        className="flex items-center gap-3 bg-white dark:bg-slate-800/50 border border-[#e2e8f0] dark:border-slate-700 rounded-xl p-3"
                      >
                        {/* Product image */}
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-700">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>

                        {/* Name + quantity */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            x{item.quantity} adet
                          </p>
                        </div>

                        {/* Line total */}
                        <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400 flex-shrink-0">
                          ₺{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Order total */}
                  <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gradient">₺{order.total.toFixed(2)}</p>
                      <p className="text-slate-500 text-xs mt-0.5">Sipariş toplamı</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
