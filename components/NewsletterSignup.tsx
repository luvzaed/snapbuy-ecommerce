'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus('error');
      setMessage('Geçersiz e-posta adresi');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error ?? 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch {
      setStatus('error');
      setMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <section className="w-full mt-20 bg-gradient-to-br from-[#f0fdf4] to-[#f0f9ff] dark:from-[#0f2027] dark:to-[#134e5e] py-16 px-4">
      <div className="max-w-[600px] mx-auto text-center">

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.08)] mb-6">
          <Mail className="w-6 h-6 text-cyan-500" />
        </div>

        {/* Heading */}
        <h2 className="text-[28px] sm:text-[32px] font-bold text-slate-900 dark:text-white leading-tight mb-3">
          Fırsatlardan İlk Sen Haberdar Ol!
        </h2>

        {/* Subtitle */}
        <p className="text-base text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Yeni ürünler, indirimler ve özel teklifler için bültenimize abone olun.
        </p>

        {/* Success state */}
        {status === 'success' ? (
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.06)] border border-emerald-100 dark:border-emerald-900/40">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <p className="text-slate-700 dark:text-slate-200 font-medium">
              Teşekkürler! Sizi haberdar edeceğiz.
            </p>
          </div>
        ) : (
          /* Signup form */
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Email input */}
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') { setStatus('idle'); setMessage(''); }
                }}
                placeholder="E-posta adresinizi girin"
                className={`flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 ${
                  status === 'error'
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-[#e2e8f0] dark:border-slate-700'
                }`}
                disabled={status === 'loading'}
                aria-label="E-posta adresi"
              />

              {/* Submit button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm text-white gradient-brand transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100 shadow-md shadow-cyan-500/20 flex-shrink-0"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gönderiliyor…
                  </>
                ) : (
                  'Abone Ol'
                )}
              </button>
            </div>

            {/* Inline error */}
            {status === 'error' && message && (
              <p className="mt-2.5 text-sm text-red-500 dark:text-red-400 text-left">
                {message}
              </p>
            )}
          </form>
        )}

        {/* Privacy note */}
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Spam yok. İstediğiniz zaman aboneliğinizi iptal edebilirsiniz.
        </p>
      </div>
    </section>
  );
}
