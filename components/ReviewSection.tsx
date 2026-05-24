'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, Send, Loader2, User, MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

interface ReviewUser {
  id: number;
  name: string | null;
  email: string;
}

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: ReviewUser;
}

interface ReviewSectionProps {
  productId: number;
}

function StarRating({ rating, onRate, interactive = false, size = 'w-5 h-5' }: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
  size?: string;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
        >
          <Star
            className={`${size} transition-colors ${
              star <= (hover || rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-slate-300 dark:text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Pre-fill if user already has a review
  useEffect(() => {
    if (user && reviews.length > 0) {
      const existing = reviews.find((r) => r.user.id === user.id);
      if (existing) {
        setRating(existing.rating);
        setComment(existing.comment || '');
      }
    }
  }, [user, reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Yorum yapmak için lütfen giriş yapın');
      return;
    }
    if (rating === 0) {
      toast.error('Lütfen bir puan seçin');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId, rating, comment }),
      });

      if (res.ok) {
        toast.success('Değerlendirme gönderildi!');
        await fetchReviews();
      } else {
        toast.error('Değerlendirme gönderilemedi');
      }
    } catch {
      toast.error('Değerlendirme gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
        <MessageSquare className="w-6 h-6 text-indigo-500" />
        Değerlendirmeler ve Puanlar
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rating Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-fit">
          <div className="text-center mb-6">
            <p className="text-5xl font-extrabold text-gradient mb-1">{avgRating.toFixed(1)}</p>
            <StarRating rating={Math.round(avgRating)} size="w-5 h-5" />
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{reviews.length} {reviews.length === 1 ? 'değerlendirme' : 'değerlendirme'}</p>
          </div>

          {/* Rating bars */}
          <div className="space-y-2">
            {ratingCounts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400 w-4 font-medium">{star}</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List + Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Review Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {user ? (reviews.some((r) => r.user.id === user.id) ? 'Değerlendirmenizi güncelleyin' : 'Değerlendirme yazın') : 'Yorum yapmak için giriş yapın'}
            </h3>
            {user ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Puanınız</label>
                  <StarRating rating={rating} onRate={setRating} interactive size="w-7 h-7" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Yorum (isteğe bağlı)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Bu ürünle ilgili deneyiminizi paylaşın..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submitting ? 'Gönderiliyor...' : 'Değerlendirme Gönder'}
                </button>
              </form>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Lütfen yorum yapmak için <a href="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">giriş yapın</a>.
              </p>
            )}
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-sm">
              <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Henüz değerlendirme yok. Bu ürünü ilk değerlendiren siz olun!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-white font-semibold text-sm">{review.user.name || review.user.email}</p>
                        <p className="text-slate-400 text-xs">
                          {new Date(review.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="w-4 h-4" />
                  </div>
                  {review.comment && (
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed pl-[52px]">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
