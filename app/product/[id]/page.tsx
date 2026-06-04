import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Truck,
  ShieldCheck,
  Zap,
  Battery,
  Award,
  Shield,
  Heart,
  Activity,
  Sparkles,
  Gem,
  Leaf,
  Check,
  type LucideIcon,
} from 'lucide-react';
import ProductActions from '@/components/ProductActions';
import ReviewSection from '@/components/ReviewSection';
import { formatPrice } from '@/lib/format';

// ── Category-aware feature chips ─────────────────────────────────────────────
type FeatureChip = { label: string; Icon: LucideIcon };

function getFeatureChips(category: string): [FeatureChip, FeatureChip, FeatureChip] {
  const c = category.toLowerCase();
  if (c.includes('elektronik') || c.includes('electronic') || c.includes('tech')) {
    return [
      { label: 'Hızlı Performans', Icon: Zap },
      { label: 'Uzun Pil Ömrü',   Icon: Battery },
      { label: 'Premium Yapı',    Icon: Award },
    ];
  }
  if (c.includes('spor') || c.includes('sport') || c.includes('fitness')) {
    return [
      { label: 'Dayanıklı Yapı',     Icon: Shield },
      { label: 'Konforlu Kullanım',  Icon: Heart },
      { label: 'Yüksek Performans',  Icon: Activity },
    ];
  }
  if (c.includes('aksesuar') || c.includes('accessor')) {
    return [
      { label: 'Premium Malzeme', Icon: Sparkles },
      { label: 'Şık Tasarım',     Icon: Gem },
      { label: 'Uzun Ömürlü',     Icon: Award },
    ];
  }
  if (c.includes('giyim') || c.includes('fashion') || c.includes('clothing')) {
    return [
      { label: 'Premium Kumaş', Icon: Sparkles },
      { label: 'Şık Tasarım',   Icon: Gem },
      { label: 'Konforlu',      Icon: Heart },
    ];
  }
  if (c.includes('beauty') || c.includes('güzellik') || c.includes('kozmet')) {
    return [
      { label: 'Doğal İçerik',   Icon: Leaf },
      { label: 'Cilt Dostu',     Icon: Heart },
      { label: 'Premium Kalite', Icon: Award },
    ];
  }
  if (
    c.includes('home') || c.includes('kitchen') ||
    c.includes('ev')   || c.includes('mutfak')
  ) {
    return [
      { label: 'Dayanıklı',   Icon: Shield },
      { label: 'Kullanışlı',  Icon: Check },
      { label: 'Şık Tasarım', Icon: Gem },
    ];
  }
  // Default fallback
  return [
    { label: 'Premium Kalite',     Icon: Award },
    { label: 'Hızlı Teslimat',     Icon: Truck },
    { label: 'Güvenli Alışveriş',  Icon: Shield },
  ];
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  const product = await prisma.product.findUnique({
    where: { id: Number(productId) },
  });

  if (!product) {
    notFound();
  }

  const productForCart = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    category: product.category,
    description: product.description || '',
    stock: product.stock,
  };

  // Fetch up to 4 products from the same category, excluding this product
  const relatedProducts = await prisma.product.findMany({
    where: { category: product.category, id: { not: product.id } },
    take: 4,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors mb-10 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Mağazaya Dön</span>
      </Link>

      <div className="bg-white dark:bg-[#0a0f1e]/80 backdrop-blur-xl rounded-3xl p-6 lg:p-12 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          {/* Image Section */}
          <div className="lg:col-span-5 relative rounded-3xl overflow-hidden bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 p-4">
            <div className="w-full aspect-square relative rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.name}
                className="object-cover w-full h-full hover:scale-110 transition-transform duration-700"
              />
            </div>
            <span className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-full text-xs font-bold tracking-wider text-cyan-600 dark:text-cyan-400 border border-cyan-500/40 dark:border-cyan-500/30 uppercase shadow-lg">
              {product.category}
            </span>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
              {product.name}
            </h1>

            <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 mb-8">
              ₺{formatPrice(product.price)}
            </div>

            {/* Stock badge — shown only when stock is low or zero */}
            {product.stock === 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                Stokta Yok — şu an mevcut değil
              </div>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-sm font-semibold mb-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
                Son {product.stock} ürün kaldı!
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-slate-900 dark:text-white font-semibold text-lg mb-3">
                Bu Ürün Hakkında
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-200 dark:border-white/5">
                {product.description}
              </p>
            </div>

            {/* Feature chips — category-aware */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {getFeatureChips(product.category).map(({ label, Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-center"
                >
                  <Icon className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mb-2" />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Quantity selector + Add to Cart */}
            <div className="mt-auto">
              <ProductActions product={productForCart} />
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex items-center gap-6 border-t border-slate-200 dark:border-white/10 pt-6">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Truck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-medium">Ücretsiz Kargo</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-medium">1 Yıl Garanti</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Ratings */}
      <ReviewSection productId={product.id} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Benzer{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
              Ürünler
            </span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-xl hover:shadow-cyan-500/10 transition-all group flex flex-col"
              >
                <div className="aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="p-4 flex flex-col gap-1.5">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-snug">
                    {p.name}
                  </h3>
                  <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                    ₺{formatPrice(p.price)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
