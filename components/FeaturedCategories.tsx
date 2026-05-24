'use client';

import Link from 'next/link';
import Image from 'next/image';

const categories = [
  {
    name: 'Electronics',
    tagline: 'Cutting-edge gadgets & tech',
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&fit=crop',
    link: '/shop?category=Electronics',
    color: 'from-cyan-600/80 to-blue-700/80',
    span: 'md:col-span-2 md:row-span-2',
    size: 'large',
  },
  {
    name: 'Fashion',
    tagline: 'Wardrobe essentials',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&fit=crop',
    link: '/shop?category=Fashion',
    color: 'from-rose-600/80 to-pink-700/80',
    span: 'md:col-span-1 md:row-span-1',
    size: 'small',
  },
  {
    name: 'Sports',
    tagline: 'Gear up & perform',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&fit=crop',
    link: '/shop?category=Sports',
    color: 'from-emerald-600/80 to-teal-700/80',
    span: 'md:col-span-1 md:row-span-1',
    size: 'small',
  },
  {
    name: 'Home & Kitchen',
    tagline: 'Modern living essentials',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&fit=crop',
    link: '/shop?category=Home%20%26%20Kitchen',
    color: 'from-amber-600/80 to-orange-700/80',
    span: 'md:col-span-1 md:row-span-1',
    size: 'small',
  },
  {
    name: 'Accessories',
    tagline: 'Finish every look',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop',
    link: '/shop?category=Accessories',
    color: 'from-violet-600/80 to-purple-700/80',
    span: 'md:col-span-1 md:row-span-1',
    size: 'small',
  },
  {
    name: 'Beauty',
    tagline: 'Glow & self-care',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&fit=crop',
    link: '/shop?category=Beauty',
    color: 'from-fuchsia-600/80 to-pink-700/80',
    span: 'md:col-span-1 md:row-span-1',
    size: 'small',
  },
  {
    name: 'Footwear',
    tagline: 'Step in style',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop',
    link: '/shop?category=Footwear',
    color: 'from-slate-600/80 to-gray-700/80',
    span: 'md:col-span-1 md:row-span-1',
    size: 'small',
  },
];

export default function FeaturedCategories() {
  return (
    <section className="py-20 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Shop by Category
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
            Browse <span className="text-gradient">Collections</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto">
            Explore our curated selection across all departments.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-auto md:grid-rows-2 gap-3 h-auto md:h-[560px]">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.link}
              className={`group relative overflow-hidden rounded-2xl ${cat.span} cursor-pointer`}
            >
              {/* Background Image */}
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes={cat.size === 'large' ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Gradient Overlay — always visible */}
              <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-60 group-hover:opacity-75 transition-opacity duration-500`} />

              {/* Bottom text */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-10">
                <h3 className={`font-bold text-white tracking-tight drop-shadow-lg ${cat.size === 'large' ? 'text-2xl sm:text-3xl mb-1' : 'text-base sm:text-lg'}`}>
                  {cat.name}
                </h3>
                <p className={`text-white/80 font-medium drop-shadow ${cat.size === 'large' ? 'text-sm sm:text-base' : 'text-xs hidden sm:block'}`}>
                  {cat.tagline}
                </p>

                {/* Shop Now pill - visible on hover */}
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white text-xs font-semibold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  Shop Now →
                </div>
              </div>

              {/* Top shine on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
