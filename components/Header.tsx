'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShoppingCart,
  Menu,
  X,
  ScanSearch,
  User,
  ChevronDown,
  Search,
  UserCircle,
  Package,
  LayoutDashboard,
  LogOut,
  Shield,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import VisualSearch from '@/components/VisualSearch';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';

export default function Header() {
  const { user, logout, cartCount } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [vsOpen, setVsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);

    toast.success('Başarıyla çıkış yapıldı!');

    router.push('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMenuOpen(false);
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      e.stopPropagation();
      document.documentElement.style.scrollBehavior = 'smooth';
      window.scrollTo(0, 0);
      setTimeout(() => {
        document.documentElement.style.scrollBehavior = 'auto';
      }, 1000);
    }
    setMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm'
          : 'bg-transparent border-b border-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Logo */}
          <Link
            href="/"
            onClick={handleHomeClick}
            className="flex items-center gap-2.5 group shrink-0 cursor-pointer"
          >
            <span className="text-xl font-bold tracking-tight">
              <span className="text-gradient">Snap</span>
              <span className="text-slate-900 dark:text-white">Buy</span>
            </span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="relative w-full group"
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ürün ara..."
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full py-2.5 pl-11 pr-12 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setVsOpen(true)}
                title="Yapay Zeka ile Görsel Arama"
                className="absolute inset-y-0 right-1.5 my-1.5 px-2.5 flex items-center bg-cyan-50 dark:bg-cyan-900/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 rounded-full transition-all border border-cyan-100 dark:border-cyan-800"
              >
                <ScanSearch className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            <Link
              href="/"
              onClick={handleHomeClick}
              className="px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer font-medium"
            >
              Ana Sayfa
            </Link>
            <Link
              href="/shop"
              className="px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 font-medium"
            >
              Mağaza
            </Link>

            {/* User Dropdown */}
            <div className="relative ml-1" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-1 p-2.5 rounded-xl border transition-all duration-200 ${userMenuOpen || user
                    ? 'border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-200 dark:hover:border-cyan-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm'
                  }`}
              >
                <User className="w-5 h-5" />
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 shadow-xl animate-fade-in-up">
                  {!user ? (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-medium"
                      >
                        Giriş Yap
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-medium"
                      >
                        Kayıt Ol
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-3 mb-1 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">
                          Giriş yapan hesap
                        </p>
                        <p className="text-sm text-slate-900 dark:text-slate-100 font-bold truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="flex flex-col gap-0.5 mb-1">
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-medium"
                        >
                          <UserCircle className="w-4 h-4 text-cyan-500" />
                          Profil
                        </Link>

                        <Link
                          href="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-medium"
                        >
                          <Package className="w-4 h-4 text-cyan-500" />
                          Siparişlerim
                        </Link>

                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-medium"
                        >
                          <LayoutDashboard className="w-4 h-4 text-cyan-500" />
                          Panelim
                        </Link>

                        {user.role === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all font-medium"
                          >
                            <Shield className="w-4 h-4 text-amber-500" />
                            Yönetici Paneli
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-700 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          Çıkış Yap
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative ml-1 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-cyan-200 dark:hover:border-cyan-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 gradient-brand rounded-full text-[10px] flex items-center justify-center text-white font-bold shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setVsOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              <ScanSearch className="w-5 h-5" />
            </button>
            <Link
              href="/cart"
              className="relative p-2 text-slate-600 hover:text-cyan-600"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute 1 top-0 right-0 w-4 h-4 gradient-brand rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              className="p-2 rounded-lg text-slate-600 hover:text-cyan-600 hover:bg-slate-100 transition-all"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Expanded */}
        {menuOpen && (
          <div className="md:hidden pb-6 flex flex-col gap-1 animate-fade-in-up border-t border-slate-200 dark:border-slate-700 pt-4 mt-1 bg-white dark:bg-slate-900">
            <div className="px-3 pb-3">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ürün ara..."
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:bg-white shadow-inner"
                />
              </form>
            </div>
            <Link
              href="/"
              onClick={handleHomeClick}
              className="px-3 py-3 rounded-xl text-base text-slate-600 hover:text-cyan-600 hover:bg-slate-50 cursor-pointer font-medium"
            >
              Ana Sayfa
            </Link>
            <Link
              href="/shop"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-3 rounded-xl text-base text-slate-600 hover:text-cyan-600 hover:bg-slate-50 font-medium"
            >
              Mağaza
            </Link>

            {!user ? (
              <>
                <Link
                  href="/login"
                  className="px-3 py-3 rounded-xl text-base text-slate-600 hover:text-cyan-600 hover:bg-slate-50 font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-3 rounded-xl text-base text-slate-600 hover:text-cyan-600 hover:bg-slate-50 font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Kayıt Ol
                </Link>
              </>
            ) : (
              <>
                <div className="px-3 py-2 mt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-bold">
                    Hesabım
                  </p>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-slate-700 hover:text-cyan-600 hover:bg-slate-50 font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserCircle className="w-5 h-5 text-cyan-500" /> Profil
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-slate-700 hover:text-cyan-600 hover:bg-slate-50 font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Package className="w-5 h-5 text-cyan-500" /> Siparişlerim
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-slate-700 hover:text-cyan-600 hover:bg-slate-50 font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-5 h-5 text-cyan-500" /> Panelim
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Shield className="w-5 h-5 text-amber-500" /> Yönetici Paneli
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-red-600 hover:bg-red-50 mt-1 font-medium"
                  >
                    <LogOut className="w-5 h-5" /> Çıkış Yap
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {vsOpen && <VisualSearch onClose={() => setVsOpen(false)} />}
    </header>
  );
}