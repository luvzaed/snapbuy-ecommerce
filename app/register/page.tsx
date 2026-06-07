'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormInput from '@/components/FormInput';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading, setAuthUser } = useAuth();

  // Already logged in? Don't show the register form — send them to the homepage.
  useEffect(() => {
    if (!authLoading && user) router.push('/');
  }, [authLoading, user, router]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Calculate password strength based on specific criteria
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = calculateStrength(form.password);
  const strengthLabels = ['', 'Zayıf', 'Orta', 'İyi', 'Güçlü'];
  const strengthColors = [
    'bg-slate-200',
    'bg-red-500',
    'bg-yellow-500',
    'bg-cyan-500',
    'bg-emerald-500',
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Ad gerekli';
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!EMAIL_RE.test(form.email)) errs.email = 'Geçersiz e-posta adresi';

    if (form.password.length < 8) {
      errs.password = 'Şifre en az 8 karakter olmalı';
    }

    if (form.password !== form.confirm) {
      errs.confirm = 'Şifreler eşleşmiyor';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      if (response.ok) {
        // Auto-login: hit the login endpoint with the same credentials so the
        // auth_session cookie gets set (the registration endpoint doesn't set
        // a cookie, and the edge middleware needs that cookie).
        const loginRes = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          setAuthUser(loginData.user);
          toast.success('Hesabınız başarıyla oluşturuldu!');
          router.push('/');
        } else {
          // Registration worked but auto-login failed for some reason —
          // fall back to sending the user to the login page.
          toast.success('Hesabınız oluşturuldu. Lütfen giriş yapın.');
          router.push('/login');
        }
      } else {
        const data = await response.json();
        setErrors({
          email: data.error || data.message || 'Bir şeyler ters gitti',
        });
      }
    } catch {
      setErrors({ email: 'Ağ hatası, lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Avoid flashing the form while auth resolves or for already-logged-in users.
  if (authLoading || user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 relative bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Light background decorations */}
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-cyan-100/50 dark:bg-cyan-900/20 rounded-full blur-[100px]" />
      <div className="absolute inset-0 dot-grid opacity-20" />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Hesap oluştur
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              SnapBuy&apos;a bugün katılın — ücretsiz
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FormInput
              id="name"
              label="Ad Soyad"
              type="text"
              placeholder="Adınızı ve soyadınızı girin"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
              required
            />
            <FormInput
              id="reg-email"
              label="E-posta adresi"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              required
            />

            <div className="flex flex-col">
              <FormInput
                id="reg-password"
                label="Şifre"
                type="password"
                placeholder="En az 8 karakter"
                value={form.password}
                onChange={set('password')}
                error={errors.password}
                required
              />

              {/* Dynamic Password Strength Bar */}
              {form.password.length > 0 && (
                <div className="mt-2 pl-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-slate-500">
                      Şifre gücü
                    </span>
                    <span
                      className={`text-xs font-bold ${strength > 2 ? 'text-emerald-500' : strength > 1 ? 'text-yellow-600' : 'text-red-500'}`}
                    >
                      {strengthLabels[strength]}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-slate-100">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-full flex-1 transition-all duration-300 ${
                          strength >= level
                            ? strengthColors[strength]
                            : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <FormInput
              id="confirm"
              label="Şifre Tekrar"
              type="password"
              placeholder="Şifrenizi tekrar girin"
              value={form.confirm}
              onChange={set('confirm')}
              error={errors.confirm}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl gradient-brand text-white font-semibold text-base hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/30 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Hesap Oluştur
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-600 dark:text-slate-400 text-sm mt-6">
            Zaten hesabınız var mı?{' '}
            <Link
              href="/login"
              className="text-cyan-600 hover:text-cyan-700 font-bold hover:underline transition-colors"
            >
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
