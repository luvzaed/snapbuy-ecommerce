'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, MessageSquare, LogIn, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

interface ReviewSectionProps {
  productId: number;
}

interface ReviewWithUser {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: number; name: string | null; email: string };
}

function reviewerName(user: ReviewWithUser['user']): string {
  if (user.name && user.name.trim()) return user.name;
  return user.email.split('@')[0];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Read-only star row
function Stars({ value, className = 'w-4 h-4' }: { value: number; className?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${className} ${
            n <= value
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-slate-300 dark:text-slate-600'
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Which review id is currently being deleted (drives loading spinner)
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteReview = async (reviewId: number) => {
    const confirmed = window.confirm('Bu yorumu silmek istediğinizden emin misiniz?');
    if (!confirmed) return;

    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Yorum başarıyla silindi.');
        await loadReviews();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Yorum silinemedi.');
      }
    } catch {
      toast.error('Yorum silinemedi.');
    } finally {
      setDeletingId(null);
    }
  };

  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Yorumlar yüklenemedi:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Whether the user already reviewed this product (drives the heading/button label)
  const existingReview = user
    ? reviews.find((r) => r.user.id === user.id)
    : undefined;

  const reviewCount = reviews.length;
  const average =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error('Lütfen bir puan seçin.');
      return;
    }
    if (!comment.trim()) {
      toast.error('Lütfen bir yorum yazın.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.id,
          productId,
          rating,
          comment: comment.trim(),
        }),
      });

      if (res.ok) {
        toast.success(
          existingReview
            ? 'Değerlendirmeniz güncellendi!'
            : 'Değerlendirmeniz kaydedildi!',
        );
        // Reset the form after a successful submit
        setRating(0);
        setHoverRating(0);
        setComment('');
        await loadReviews();
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          toast.error('Yorum yapmak için giriş yapmalısınız.');
        } else {
          toast.error(data.error || 'Değerlendirme gönderilemedi.');
        }
      }
    } catch (err) {
      console.error('Değerlendirme gönderilemedi:', err);
      toast.error('Değerlendirme gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-12 bg-white dark:bg-[#0a0f1e]/80 backdrop-blur-xl rounded-3xl p-6 lg:p-10 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-2xl">
      {/* Header + average */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Değerlendirmeler ve Yorumlar
          </h2>
        </div>

        {reviewCount > 0 && (
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {average.toFixed(1)}
            </span>
            <div className="flex flex-col">
              <Stars value={Math.round(average)} />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {reviewCount} değerlendirme
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Submission form / prompts */}
      <div className="mb-10">
        {!user ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
            <p className="text-slate-700 dark:text-slate-300 font-medium text-center sm:text-left">
              Değerlendirme yapmak için giriş yapmalısınız.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 gradient-brand text-white font-bold px-5 py-2.5 rounded-xl hover:opacity-90 hover:scale-105 transition-all duration-300 shrink-0"
            >
              <LogIn className="w-4 h-4" />
              Giriş Yap
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {existingReview ? 'Değerlendirmenizi Güncelleyin' : 'Bu Ürünü Değerlendirin'}
            </h3>

            {/* Rating input */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Puanınız
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                    aria-label={`${n} yıldız`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        n <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-transparent text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment input */}
            <div className="mb-5">
              <label
                htmlFor="review-comment"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                Yorumunuz
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Bu ürün hakkındaki düşüncelerinizi paylaşın..."
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white p-3.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 gradient-brand text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {existingReview ? 'Yorumu Güncelle' : 'Değerlendirmeyi Gönder'}
            </button>
          </form>
        )}
      </div>

      {/* Review list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl skeleton border border-slate-200 dark:border-white/10"
            />
          ))}
        </div>
      ) : reviewCount === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">
            Henüz değerlendirme yok. İlk yorumu sen yap!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const isOwn = user?.id === r.user.id;
            const canDelete = isOwn || user?.role === 'admin';
            const isDeleting = deletingId === r.id;
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white font-bold uppercase shrink-0">
                      {reviewerName(r.user).charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {reviewerName(r.user)}
                        {isOwn && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 rounded-full px-2 py-0.5">
                            Siz
                          </span>
                        )}
                      </p>
                      <Stars value={r.rating} />
                    </div>
                  </div>

                  {/* Date + optional delete button */}
                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {formatDate(r.createdAt)}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteReview(r.id)}
                        disabled={isDeleting}
                        title={user?.role === 'admin' && !isOwn ? 'Yönetici: yorumu sil' : 'Yorumu sil'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {r.comment && (
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-2 pl-14">
                    {r.comment}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
