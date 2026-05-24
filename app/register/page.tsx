'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormInput from '@/components/FormInput';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
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
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-slate-200',
    'bg-red-500',
    'bg-yellow-500',
    'bg-cyan-500',
    'bg-emerald-500',
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.includes('@')) errs.email = 'Valid email required';

    if (form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (form.password !== form.confirm) {
      errs.confirm = 'Passwords do not match';
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
        router.push('/login');
      } else {
        const data = await response.json();
        setErrors({ email: data.message || 'Something went wrong' });
      }
    } catch (error) {
      setErrors({ email: 'Network error, please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

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
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create account</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              Join SnapBuy today — it's free
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FormInput
              id="name"
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
              required
            />
            <FormInput
              id="reg-email"
              label="Email address"
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
                label="Password"
                type="password"
                placeholder="Min 8 characters"
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
                      Password strength
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
                        className={`h-full flex-1 transition-all duration-300 ${strength >= level
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
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
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
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-600 dark:text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-cyan-600 hover:text-cyan-700 font-bold hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}