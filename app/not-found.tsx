import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 wave-bg">
      <div className="text-center max-w-lg mx-auto animate-fade-in-up">
        {/* Large 404 number */}
        <h1 className="text-[10rem] sm:text-[12rem] font-black leading-none select-none text-gradient">
          404
        </h1>

        {/* Subtitle */}
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white -mt-6 mb-4">
          Sayfa bulunamadı
        </h2>

        {/* Description */}
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-base leading-relaxed">
          Aradığınız sayfa mevcut değil veya taşınmış.
          Sizi doğru yere yönlendirelim.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
              />
            </svg>
            Ana Sayfaya Dön
          </Link>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Mağazayı Keşfet
          </Link>
        </div>
      </div>
    </div>
  );
}
