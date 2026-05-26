'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Users,
  ShieldCheck,
  Trash2,
  Loader2,
  Mail,
  User,
  Package,
  Search,
  RefreshCw,
  ChevronDown,
  Calendar,
  UserCheck,
  UserX,
} from 'lucide-react';

interface AdminUser {
  id: number;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  _count: { orders: number };
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        toast.success(`User role updated to ${newRole}`);
      } else {
        toast.error('Failed to update user role');
      }
    } catch {
      toast.error('Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteUser = async (userId: number) => {
    // Prevent self-deletion
    if (userId === user?.id) {
      toast.error("Kendi hesabınızı silemezsiniz!");
      return;
    }

    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;

    setDeletingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        toast.success('Kullanıcı başarıyla silindi');
      } else {
        toast.error('Kullanıcı silinemedi. Mevcut siparişleri olabilir.');
      }
    } catch {
      toast.error('Kullanıcı silinemedi');
    } finally {
      setDeletingId(null);
    }
  };

  if (!user || user.role !== 'admin') return null;

  // ── Filtering ──────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      filterRole === 'ALL' || u.role.toUpperCase() === filterRole;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role.toUpperCase() === 'ADMIN').length;
  const userCount = users.filter((u) => u.role.toUpperCase() === 'USER').length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Kullanıcı <span className="text-gradient">Yönetimi</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Kullanıcı hesaplarını ve yetkilerini görüntüle ve yönet
            </p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Toplam</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{users.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Yöneticiler</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{adminCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-indigo-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Müşteriler</span>
          </div>
          <p className="text-2xl font-bold text-indigo-600">{userCount}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="İsim veya e-posta ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'ADMIN', 'USER'].map((role) => {
            const isActive = filterRole === role;
            return (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                  isActive
                    ? 'gradient-brand text-white border-transparent shadow-lg shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                {role === 'ALL' ? 'Tümü' : role === 'ADMIN' ? 'Yöneticiler' : 'Müşteriler'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-16 text-center">
          <UserX className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Kullanıcı bulunamadı</h3>
          <p className="text-slate-500 dark:text-slate-400">
            {searchQuery
              ? 'Aramanıza uygun kullanıcı bulunamadı.'
              : 'Henüz kayıtlı kullanıcı yok.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <div className="col-span-4">Kullanıcı</div>
            <div className="col-span-2">Rol</div>
            <div className="col-span-2">Siparişler</div>
            <div className="col-span-2">Katılım</div>
            <div className="col-span-2 text-right">İşlemler</div>
          </div>

          {/* User Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.map((u, i) => {
              const isCurrentUser = u.id === user.id;
              const isAdmin = u.role.toUpperCase() === 'ADMIN';
              const isUpdating = updatingId === u.id;
              const isDeleting = deletingId === u.id;

              return (
                <div
                  key={u.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  {/* User Info */}
                  <div className="sm:col-span-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isAdmin
                        ? 'gradient-brand text-white'
                        : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {isAdmin ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-900 dark:text-white font-semibold text-sm truncate flex items-center gap-2">
                        {u.name || 'İsim yok'}
                        {isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-medium">
                            Sen
                          </span>
                        )}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {u.email}
                      </p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="sm:col-span-2">
                    <div className="relative">
                      <select
                        value={u.role.toUpperCase()}
                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                        disabled={isCurrentUser || isUpdating}
                        className={`appearance-none w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 pr-7 text-xs font-medium cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          isAdmin
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <option value="USER">Müşteri</option>
                        <option value="ADMIN">Yönetici</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        {isUpdating ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Orders */}
                  <div className="sm:col-span-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <Package className="w-3 h-3 text-indigo-500" />
                      {u._count?.orders ?? 0} sipariş
                    </span>
                  </div>

                  {/* Joined Date */}
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(u.createdAt).toLocaleDateString('tr-TR', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      onClick={() => deleteUser(u.id)}
                      disabled={isCurrentUser || isDeleting}
                      title={isCurrentUser ? "Kendini silemezsin" : 'Kullanıcıyı sil'}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 disabled:hover:scale-100"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
