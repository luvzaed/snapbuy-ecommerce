'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShoppingCart,
  Zap,
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
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import VisualSearch from '@/components/VisualSearch';
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

    // Show success toast notification for logout
    toast.success('Successfully logged out!');

    router.push('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
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
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass border-b border-white/[0.07] shadow-2xl shadow-black/40'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          <Link
            href="/"
            onClick={handleHomeClick}
            className="flex items-center gap-2.5 group shrink-0 cursor-pointer"
          >
            <div className="relative w-8 h-8 rounded-xl gradient-brand flex items-center justify-center animate-pulse-glow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-gradient">Snap</span>
              <span className="text-white">Buy</span>
            </span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="relative w-full group"
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setVsOpen(true)}
                title="Visual Search with AI"
                className="absolute inset-y-0 right-1.5 my-1.5 px-2.5 flex items-center bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-full transition-all border border-cyan-500/20"
              >
                <ScanSearch className="h-4 w-4" />
              </button>
            </form>
          </div>

          <nav className="hidden md:flex items-center gap-1 shrink-0">
            <Link
              href="/"
              onClick={handleHomeClick}
              className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
            >
              Home
            </Link>
            <Link
              href="/shop"
              className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
            >
              Shop
            </Link>

            <div className="relative ml-1" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-1 p-2.5 rounded-xl glass-light transition-all duration-200 ${
                  userMenuOpen || user
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30'
                }`}
              >
                <User className="w-5 h-5" />
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 glass border border-white/[0.08] rounded-2xl p-1.5 shadow-2xl animate-fade-in-up">
                  {!user ? (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
                      >
                        Log In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
                      >
                        Sign In
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-3 mb-1 border-b border-white/[0.05]">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">
                          Signed in as
                        </p>
                        <p className="text-sm text-white font-medium truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="flex flex-col gap-0.5 mb-1">
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
                        >
                          <UserCircle className="w-4 h-4 text-cyan-400" />
                          Profile
                        </Link>

                        <Link
                          href="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
                        >
                          <Package className="w-4 h-4 text-cyan-400" />
                          My Orders
                        </Link>

                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
                        >
                          <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                          Dashboard
                        </Link>
                      </div>

                      <div className="border-t border-white/[0.05] pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/cart"
              className="relative ml-1 p-2.5 rounded-xl glass-light hover:border-cyan-500/30 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 transition-all duration-200"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 gradient-brand rounded-full text-[10px] flex items-center justify-center text-white font-bold shadow-lg">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setVsOpen(true)}
              className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <ScanSearch className="w-5 h-5" />
            </button>
            <Link
              href="/cart"
              className="relative p-2 text-slate-400 hover:text-white"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 gradient-brand rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
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

        {menuOpen && (
          <div className="md:hidden pb-6 flex flex-col gap-1 animate-fade-in-up border-t border-white/[0.07] pt-4 mt-1">
            <div className="px-3 pb-3">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </form>
            </div>
            <Link
              href="/"
              onClick={handleHomeClick}
              className="px-3 py-3 rounded-xl text-base text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
            >
              Home
            </Link>
            <Link
              href="/shop"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-3 rounded-xl text-base text-slate-400 hover:text-white hover:bg-white/[0.06]"
            >
              Shop
            </Link>

            {!user ? (
              <>
                <Link
                  href="/login"
                  className="px-3 py-3 rounded-xl text-base text-slate-400 hover:text-white hover:bg-white/[0.06]"
                  onClick={() => setMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-3 rounded-xl text-base text-slate-400 hover:text-white hover:bg-white/[0.06]"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
              </>
            ) : (
              <>
                <div className="px-3 py-2 mt-2 border-t border-white/[0.05]">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                    My Account
                  </p>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-slate-300 hover:text-white hover:bg-white/[0.06]"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserCircle className="w-5 h-5 text-cyan-400" /> Profile
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-slate-300 hover:text-white hover:bg-white/[0.06]"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Package className="w-5 h-5 text-cyan-400" /> My Orders
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-slate-300 hover:text-white hover:bg-white/[0.06]"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-5 h-5 text-cyan-400" />{' '}
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-red-400 hover:bg-red-500/10 mt-1"
                  >
                    <LogOut className="w-5 h-5" /> Logout
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
