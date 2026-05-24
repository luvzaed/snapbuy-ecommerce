'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormInput from '@/components/FormInput';
import Link from 'next/link';
import { UserPlus, Zap } from 'lucide-react';

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
    // Minimum 8 characters
    if (pass.length >= 8) score += 1;
    // Contains both lowercase and uppercase letters
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    // Contains at least one number
    if (/\d/.test(pass)) score += 1;
    // Contains at least one special character
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = calculateStrength(form.password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-slate-700',
    'bg-red-500',
    'bg-yellow-500',
    'bg-cyan-500',
    'bg-emerald-500',
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.includes('@')) errs.email = 'Valid email required';

    // Updated validation to enforce 8 characters minimum
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
      // Send data to the backend
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
        // Redirect to login page on success
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 animated-gradient-bg relative">
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-pink-600/15 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="gradient-card border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create account</h1>
            <p className="text-slate-400 text-sm mt-1">
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
                    <span className="text-xs text-slate-400">
                      Password strength
                    </span>
                    <span
                      className={`text-xs font-medium ${strength > 2 ? 'text-emerald-400' : strength > 1 ? 'text-yellow-400' : 'text-red-400'}`}
                    >
                      {strengthLabels[strength]}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-white/5">
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
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl gradient-brand text-white font-semibold text-base hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 mt-2"
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

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
