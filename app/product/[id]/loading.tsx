export default function ProductLoading() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Back link */}
      <div className="h-5 w-32 rounded-lg skeleton mb-10" />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-12 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Image placeholder */}
          <div className="lg:col-span-5 aspect-square rounded-3xl skeleton" />

          {/* Details placeholder */}
          <div className="lg:col-span-7 flex flex-col justify-center gap-5">
            {/* Category badge */}
            <div className="h-6 w-24 rounded-full skeleton" />
            {/* Title — two lines */}
            <div className="h-10 w-4/5 rounded-xl skeleton" />
            <div className="h-10 w-3/5 rounded-xl skeleton" />
            {/* Price */}
            <div className="h-14 w-44 rounded-xl skeleton" />
            {/* Description block */}
            <div className="space-y-2.5 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="h-4 w-full rounded-lg skeleton" />
              <div className="h-4 w-full rounded-lg skeleton" />
              <div className="h-4 w-3/4 rounded-lg skeleton" />
            </div>
            {/* Feature chips */}
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 rounded-2xl skeleton" />
              <div className="h-20 rounded-2xl skeleton" />
              <div className="h-20 rounded-2xl skeleton" />
            </div>
            {/* Quantity + button */}
            <div className="h-12 w-full rounded-xl skeleton" />
            <div className="h-14 w-full rounded-xl skeleton" />
          </div>
        </div>
      </div>

      {/* Reviews skeleton */}
      <div className="mt-16 space-y-4">
        <div className="h-7 w-48 rounded-lg skeleton" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex gap-4"
          >
            <div className="w-10 h-10 rounded-full skeleton shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded-lg skeleton" />
              <div className="h-3.5 w-full rounded-lg skeleton" />
              <div className="h-3.5 w-2/3 rounded-lg skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
