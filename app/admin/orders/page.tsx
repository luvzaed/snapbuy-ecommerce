'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  Loader2,
  ChevronDown,
  User,
  Mail,
  Hash,
  Wallet,
  ShoppingBag,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface OrderUser {
  id: number;
  name: string | null;
  email: string;
}

interface OrderItemProduct {
  id: number;
  name: string;
  image: string;
  price: number;
}

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: OrderItemProduct;
}

interface AdminOrder {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  user: OrderUser;
  items: OrderItem[];
}

const statusConfig: Record<
  string,
  { icon: typeof Clock; color: string; bg: string; border: string; label: string; darkBg: string; darkBorder: string; darkColor: string }
> = {
  PENDING: {
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    darkBg: 'dark:bg-amber-900/20',
    darkBorder: 'dark:border-amber-800',
    darkColor: 'dark:text-amber-400',
    label: 'Beklemede',
  },
  PROCESSING: {
    icon: Package,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    darkBg: 'dark:bg-blue-900/20',
    darkBorder: 'dark:border-blue-800',
    darkColor: 'dark:text-blue-400',
    label: 'İşleniyor',
  },
  SHIPPED: {
    icon: Truck,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    darkBg: 'dark:bg-indigo-900/20',
    darkBorder: 'dark:border-indigo-800',
    darkColor: 'dark:text-indigo-400',
    label: 'Kargoya Verildi',
  },
  DELIVERED: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    darkBg: 'dark:bg-emerald-900/20',
    darkBorder: 'dark:border-emerald-800',
    darkColor: 'dark:text-emerald-400',
    label: 'Teslim Edildi',
  },
};

const statusOrder = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const fetchAllOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders?all=true');
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllOrders();
    }
  }, [user]);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? updatedOrder : o))
        );
        toast.success(`Order #${orderId} → ${statusConfig[newStatus]?.label || newStatus}`);
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm(`Sipariş #${orderId} silinsin mi? Bu işlem geri alınamaz.`)) return;
    setDeletingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        toast.success(`Sipariş #${orderId} silindi`);
      } else {
        toast.error('Sipariş silinemedi');
      }
    } catch {
      toast.error('Sipariş silinemedi');
    } finally {
      setDeletingId(null);
    }
  };

  if (!user || user.role !== 'admin') return null;

  const filteredOrders =
    filterStatus === 'ALL'
      ? orders
      : orders.filter((o) => o.status.toUpperCase() === filterStatus);

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status.toUpperCase() === 'PENDING').length,
    processing: orders.filter((o) => o.status.toUpperCase() === 'PROCESSING').length,
    shipped: orders.filter((o) => o.status.toUpperCase() === 'SHIPPED').length,
    delivered: orders.filter((o) => o.status.toUpperCase() === 'DELIVERED').length,
    revenue: orders.reduce((sum, o) => sum + o.total, 0),
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Sipariş <span className="text-gradient">Yönetimi</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Tüm müşteri siparişlerini görüntüle ve yönet
            </p>
          </div>
        </div>
        <button
          onClick={fetchAllOrders}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Toplam</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Beklemede</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">İşleniyor</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-indigo-500" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Kargoya Verildi</span>
          </div>
          <p className="text-2xl font-bold text-indigo-600">{stats.shipped}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Teslim Edildi</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.delivered}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-green-500" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Gelir</span>
          </div>
          <p className="text-2xl font-bold text-green-600">₺{stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['ALL', ...statusOrder].map((status) => {
          const isActive = filterStatus === status;
          const s = status !== 'ALL' ? statusConfig[status] : null;
          const count =
            status === 'ALL'
              ? orders.length
              : orders.filter((o) => o.status.toUpperCase() === status).length;

          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                isActive
                  ? 'gradient-brand text-white border-transparent shadow-lg shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {status === 'ALL' ? 'Tüm Siparişler' : s?.label || status}
              <span
                className={`ml-2 px-1.5 py-0.5 rounded-md text-xs ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-16 text-center">
          <Package className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sipariş bulunamadı</h3>
          <p className="text-slate-500 dark:text-slate-400">
            {filterStatus === 'ALL'
              ? 'Henüz sipariş verilmedi.'
              : `"${statusConfig[filterStatus]?.label || filterStatus}" durumunda sipariş yok.`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map((order, i) => {
            const statusKey = order.status.toUpperCase();
            const s = statusConfig[statusKey] || statusConfig['PENDING'];
            const StatusIcon = s.icon;
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 transition-all duration-300 hover:shadow-lg animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Order Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-slate-900 dark:text-white font-bold text-lg flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-400" />
                        Sipariş #{order.id}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.darkBg} ${s.color} ${s.darkColor} ${s.border} ${s.darkBorder}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {s.label}
                      </span>
                    </div>

                    {/* Customer info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {order.user?.name || 'İsim yok'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        {order.user?.email}
                      </span>
                      <span>
                        {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gradient">₺{order.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{order.items.length} ürün</p>
                    </div>

                    {/* Status Dropdown */}
                    <div className="relative">
                      <select
                        id={`order-status-${order.id}`}
                        name="status"
                        aria-label="Sipariş durumu"
                        value={statusKey}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        disabled={isUpdating}
                        className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-8 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {statusOrder.map((st) => (
                          <option key={st} value={st}>
                            {statusConfig[st].label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      disabled={deletingId === order.id}
                      title="Siparişi Sil"
                      className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-500 dark:text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === order.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex flex-wrap gap-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700"
                        >
                          {item.product && (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-700">
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
                            <p className="text-slate-800 dark:text-slate-200 text-sm font-medium line-clamp-1">
                              {item.product?.name || 'Ürün'}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">
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

