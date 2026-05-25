"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Package, LogOut, User, CheckCircle2, Clock, Truck, MapPin, type LucideIcon } from "lucide-react";
import Link from "next/link";

const statusConfig: Record<string, { icon: LucideIcon; color: string; bg: string; border: string; label: string }> = {
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", label: "Beklemede" },
  processing: { icon: Package, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30", label: "Hazırlanıyor" },
  shipped: { icon: Truck, color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/30", label: "Kargoda" },
  delivered: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/30", label: "Teslim Edildi" },
};

export default function DashboardPage() {
  const { user, orders, logout, cart } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  if (!user) return null;

  const handleLogout = () => { logout(); router.push("/"); };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center animate-pulse-glow">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panelim</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Tekrar hoş geldin, <span className="text-indigo-500 dark:text-indigo-400 font-medium">{user.name}</span></p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all hover:scale-105"
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="gradient-card border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Package className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{orders.length}</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Toplam Sipariş</p>
          </div>
        </div>
        <div className="gradient-card border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{cart.length}</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Sepetteki Ürünler</p>
          </div>
        </div>
        <div className="gradient-card border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">₺{orders.reduce((s, o) => s + o.total, 0).toFixed(2)}</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Toplam Harcama</p>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-400" />
          Sipariş Geçmişi
        </h2>
        {orders.length === 0 ? (
          <div className="gradient-card border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 text-lg">Henüz sipariş yok</p>
            <p className="text-slate-500 text-sm mt-1 mb-6">Siparişlerinizi burada görmek için alışverişe başlayın</p>
            <Link href="/#products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-medium hover:scale-105 transition-transform">
              Ürünlere Göz At
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order, i) => {
              const s = statusConfig[order.status];
              return (
                <div
                  key={order.id}
                  className="gradient-card border border-slate-200 dark:border-white/10 hover:border-indigo-500/40 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-indigo-500/10 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg">{order.id}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.color} ${s.border}`}>
                          <s.icon className="w-3 h-3" />
                          {s.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm">
                        <MapPin className="w-3.5 h-3.5" />
                        {new Date(order.createdAt).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gradient">₺{order.total.toFixed(2)}</p>
                      <p className="text-slate-500 text-xs mt-1">Sipariş toplamı</p>
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

// Inline icons to avoid extra imports
function ShoppingBag({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function DollarSign({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
