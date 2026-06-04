'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Shield,
  ShoppingCart,
  Pencil,
  X,
  Check,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Package,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, loading, cart, setAuthUser, orders, fetchOrders, logout } = useAuth();
  const router = useRouter();

  // Edit state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      fetchOrders();
    }
  }, [user, fetchOrders]);

  if (!user) return null;

  // ── Save profile info ────────────────────────────────────
  const handleSaveInfo = async () => {
    const errs: Record<string, string> = {};
    if (!editName.trim()) errs.name = 'İsim gerekli';
    if (!editEmail.trim()) errs.email = 'E-posta gerekli';
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!EMAIL_RE.test(editEmail.trim())) errs.email = 'Geçersiz e-posta adresi';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), email: editEmail.trim() }),
      });

      if (res.ok) {
        const updated = await res.json();
        setAuthUser({
          ...user,
          name: updated.name || editName.trim(),
          email: updated.email || editEmail.trim(),
        });
        setIsEditingInfo(false);
        toast.success('Profil başarıyla güncellendi!');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Profil güncellenemedi');
      }
    } catch {
      toast.error('Profil güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Change password ──────────────────────────────────────
  const handleChangePassword = async () => {
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = 'Mevcut şifre gerekli';
    if (!newPassword) errs.newPassword = 'Yeni şifre gerekli';
    else if (newPassword.length < 8) errs.newPassword = 'Şifre en az 8 karakter olmalı';
    else if (newPassword === currentPassword) errs.newPassword = 'Yeni şifre, mevcut şifre ile aynı olamaz.';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Şifreler eşleşmiyor';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setIsChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        toast.success('Şifre başarıyla değiştirildi!');
      } else {
        const data = await res.json();
        if (data.error === 'Current password is incorrect') {
          setErrors({ currentPassword: 'Mevcut şifre yanlış' });
        } else if (data.error === 'Yeni şifre, mevcut şifre ile aynı olamaz.') {
          setErrors({ newPassword: data.error });
        } else {
          toast.error(data.error || 'Şifre değiştirilemedi');
        }
      }
    } catch {
      toast.error('Şifre değiştirilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEditInfo = () => {
    setIsEditingInfo(false);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setErrors({});
  };

  const cancelChangePassword = () => {
    setIsChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const totalSpent = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
        <User className="w-7 h-7 text-indigo-500" />
        Profilim
      </h1>

      {/* ── Profile Card ──────────────────────────────────────×”€ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-8 mb-6">
        {/* User avatar + name */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user.name || 'Kullanıcı'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email}</p>
            </div>
          </div>
          {!isEditingInfo && (
            <button
              onClick={() => setIsEditingInfo(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              Düzenle
            </button>
          )}
        </div>

        {/* ── Editing Mode ──────────────────────────────────×”€ */}
        {isEditingInfo ? (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-5 uppercase tracking-wider">
              Kişisel Bilgileri Düzenle
            </h3>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Ad Soyad
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all ${
                      errors.name ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all ${
                      errors.email ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Save / Cancel buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveInfo}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-brand text-white font-semibold hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-60 disabled:scale-100"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Değişiklikleri Kaydet
                </button>
                <button
                  onClick={cancelEditInfo}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <X className="w-4 h-4" />
                  İptal
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Read-only Info Rows ──────────────────────────── */
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center">
                <Mail className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                  E-posta
                </p>
                <p className="font-medium text-slate-900 dark:text-white">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                  Rol
                </p>
                <p className="font-medium text-slate-900 dark:text-white capitalize">
                  {user.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                  Sepetteki Ürünler
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {cart.length} ürün
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Account Stats ────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center shadow-sm">
          <Package className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{orders.length}</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Siparişler</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center shadow-sm">
          <ShoppingCart className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{cart.length}</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Sepette</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-2xl font-bold text-gradient">₺{totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Toplam Harcama</p>
        </div>
      </div>

      {/* ── Change Password Section ──────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-8 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-semibold">Şifre</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Hesap şifrenizi değiştirin
              </p>
            </div>
          </div>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              Değiştir
            </button>
          )}
        </div>

        {isChangingPassword && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 animate-fade-in-up">
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Mevcut Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Mevcut şifrenizi girin"
                    className={`w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all ${
                      errors.currentPassword
                        ? 'border-red-400'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showCurrentPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {errors.currentPassword}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Yeni Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Yeni şifre girin (en az 8 karakter)"
                    className={`w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all ${
                      errors.newPassword
                        ? 'border-red-400'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showNewPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Yeni Şifre Tekrarı
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Yeni şifrenizi tekrar girin"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all ${
                      errors.confirmPassword
                        ? 'border-red-400'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleChangePassword}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-brand text-white font-semibold hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-60 disabled:scale-100"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Şifreyi Güncelle
                </button>
                <button
                  onClick={cancelChangePassword}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <X className="w-4 h-4" />
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Links ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-8">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
          Hızlı Bağlantılar
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all"
          >
            Siparişlerim
          </Link>
          <Link
            href="/shop"
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all"
          >
            Mağaza
          </Link>
        </div>
      </div>

      {/* ── Logout ───────────────────────────────────────────── */}
      <button
        onClick={() => { logout(); router.push('/'); }}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all mt-2"
      >
        <LogOut className="w-4 h-4" />
        Çıkış Yap
      </button>
    </div>
  );
}

