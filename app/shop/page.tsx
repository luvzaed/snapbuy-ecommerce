'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import AddToCartButton from '@/components/AddToCartButton';
import { Product } from '@/lib/types';

const ITEMS_PER_PAGE = 12;

function ShopContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Tümü']);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'Tümü',
  );
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
        setFilteredProducts(data);

        const uniqueCategories = Array.from(
          new Set(data.map((p: Product) => p.category)),
        ) as string[];
        setCategories(['Tümü', ...uniqueCategories]);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let result = [...products];

    if (selectedCategory !== 'Tümü') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)),
      );
    }

    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min) && minPrice !== '') result = result.filter((p) => p.price >= min);
    if (!isNaN(max) && maxPrice !== '') result = result.filter((p) => p.price <= max);

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'newest') result.sort((a, b) => b.id - a.id);

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, products, minPrice, maxPrice, sortBy]);

  // ── Pagination ───────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Change page and scroll back to the top so the new page starts at the top.
  const goToPage = (page: number) => {
    setCurrentPage(Math.min(totalPages, Math.max(1, page)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (currentPage >= totalPages - 3)
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Tümü');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('');
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            Ürün{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
              Koleksiyonu
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">
            Premium teknoloji ürünlerinden özenle seçilmiş koleksiyonumuzu keşfedin.
            Dijital yaşam tarzınızı yükseltmek için ihtiyacınız olan her şeyi bulun.
          </p>
        </div>

        {/* Sort + result count */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium px-3 py-2 rounded-xl shadow-sm focus:outline-none focus:border-cyan-500 cursor-pointer transition-colors"
          >
            <option value="">Varsayılan Sıralama</option>
            <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
            <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
            <option value="newest">En Yeniler</option>
          </select>

          <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl shrink-0 shadow-sm">
            <SlidersHorizontal className="w-4 h-4 mr-2 text-cyan-600 dark:text-cyan-400" />
            {filteredProducts.length} sonuç
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <div className="lg:w-1/4 shrink-0">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-6 space-y-8">
            {/* Search */}
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Ara
              </h3>
              <input
                type="text"
                placeholder="Ürün bul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-4 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-all shadow-inner"
              />
            </div>

            {/* Price range */}
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Fiyat Aralığı
              </h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min ₺"
                  value={minPrice}
                  min={0}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-all"
                />
                <input
                  type="number"
                  placeholder="Max ₺"
                  value={maxPrice}
                  min={0}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Kategoriler
              </h3>
              <div className="flex flex-col gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 border border-transparent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Product grid ─────────────────────────────────────── */}
        <div className="lg:w-3/4">
          {isLoading ? (
            /* ── Skeleton grid — mirrors real card layout ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col"
                >
                  {/* Image placeholder */}
                  <div className="aspect-square skeleton" />
                  {/* Content placeholders */}
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    {/* Title */}
                    <div className="h-5 w-3/4 rounded-lg skeleton" />
                    {/* Description — two lines */}
                    <div className="h-3.5 w-full rounded-lg skeleton" />
                    <div className="h-3.5 w-2/3 rounded-lg skeleton" />
                    {/* Price + button row */}
                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-3">
                      <div className="h-6 w-1/3 rounded-lg skeleton" />
                      <div className="h-10 w-1/3 rounded-xl skeleton" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 mb-4 border border-slate-100 dark:border-slate-700">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Ürün bulunamadı
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Mevcut filtrelerinize uygun ürün bulamadık. Aramanızı veya
                kategorinizi değiştirmeyi deneyin.
              </p>
              <button
                onClick={clearFilters}
                className="mt-6 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold transition-all"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-xl hover:shadow-cyan-500/10 transition-all group flex flex-col"
                  >
                    <Link
                      href={`/product/${product.id}`}
                      className="block relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider text-slate-700 dark:text-slate-200 uppercase border border-slate-200 dark:border-slate-700 shadow-sm">
                          {product.category}
                        </span>
                        {product.stock === 0 && (
                          <span className="px-3 py-1 bg-red-500/90 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider text-white shadow-sm">
                            Stokta Yok
                          </span>
                        )}
                        {product.stock > 0 && product.stock <= 5 && (
                          <span className="px-3 py-1 bg-orange-500/90 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider text-white shadow-sm">
                            Son {product.stock} ürün!
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="p-5 flex flex-col flex-1">
                      <Link href={`/product/${product.id}`}>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-0.5">
                            Fiyat
                          </span>
                          <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                            ₺{product.price.toLocaleString('tr-TR')}
                          </span>
                        </div>

                        <div className="w-1/2">
                          <AddToCartButton product={product} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Pagination ──────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {getPageNumbers().map((page, idx) =>
                    page === '...' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm"
                      >
                        ···
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page as number)}
                        className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                          currentPage === page
                            ? 'gradient-brand text-white border-transparent shadow-lg shadow-cyan-500/20'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600'
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
