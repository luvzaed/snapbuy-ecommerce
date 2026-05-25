'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormInput from '@/components/FormInput';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setAuthUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuthUser(data.user);
        toast.success('Başarıyla giriş yapıldı!');
        router.push('/');
      } else {
        const data = await response.json();
        setError(data.message || 'Geçersiz e-posta veya şifre');
      }
    } catch {
      setError('Ağ hatası, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Light background decorations */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-100/50 dark:bg-cyan-900/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-[100px]" />
      <div className="absolute inset-0 dot-grid opacity-20" />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Tekrar hoş geldiniz
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              SnapBuy hesabınıza giriş yapın
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FormInput
              id="email"
              label="E-posta adresi"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FormInput
              id="password"
              label="Şifre"
              type="password"
              placeholder="Şifreniz"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl gradient-brand text-white font-semibold text-base hover:opacity-90 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Giriş Yap
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-600 dark:text-slate-400 text-sm mt-6">
            Hesabınız yok mu?{' '}
            <Link
              href="/register"
              className="text-cyan-600 hover:text-cyan-700 font-bold transition-colors"
            >
              Hesap Oluştur
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}