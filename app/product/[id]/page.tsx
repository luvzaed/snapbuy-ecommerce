import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  Truck,
  ShieldCheck,
  Zap,
  Headphones,
  Battery,
} from 'lucide-react';
import AddToCartButton from '@/components/AddToCartButton'; // استدعينا الزر التفاعلي

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

  // تحويل البيانات لتناسب متطلبات الزر (Frontend Type)
  const productForCart = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    category: product.category,
    description: product.description || '',
    stock: product.stock,
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors mb-10 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Store</span>
      </Link>

      <div className="bg-white dark:bg-[#0a0f1e]/80 backdrop-blur-xl rounded-3xl p-6 lg:p-12 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          {/* Image Section (Left) */}
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

          {/* Details Section (Right) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                4.9 (128 verified reviews)
              </span>
            </div>

            <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 mb-8">
              ${product.price.toFixed(2)}
            </div>

            {/* Description Section */}
            <div className="mb-8">
              <h3 className="text-slate-900 dark:text-white font-semibold text-lg mb-3">
                About this item
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-200 dark:border-white/5">
                {product.description}
              </p>
            </div>

            {/* Features (To make the page look full) */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-center">
                <Zap className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mb-2" />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Fast Performance
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-center">
                <Battery className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mb-2" />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Long Battery
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-center">
                <Headphones className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mb-2" />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Premium Build
                </span>
              </div>
            </div>

            {/* Stock & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-6 items-center mt-auto">
              {/* Using the Interactive Client Component Button */}
              <AddToCartButton product={productForCart} />
            </div>

            {/* Trust Badges */}
            <div className="mt-8 flex items-center gap-6 border-t border-slate-200 dark:border-white/10 pt-6">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Truck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-medium">Free Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-medium">1 Year Warranty</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
