'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Star, SlidersHorizontal, Loader2 } from 'lucide-react';
import AddToCartButton from '@/components/AddToCartButton';
import { Product } from '@/lib/types';

function ShopContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('All');

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
        setCategories(['All', ...uniqueCategories]);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;

    if (selectedCategory !== 'All') {
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

    setFilteredProducts(result);
  }, [searchQuery, selectedCategory, products]);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
              Collection
            </span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            Explore our curated selection of premium tech products. Find exactly
            what you need to elevate your digital lifestyle.
          </p>
        </div>

        <div className="flex items-center text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl shrink-0 shadow-sm">
          <SlidersHorizontal className="w-4 h-4 mr-2 text-cyan-600" />
          Showing {filteredProducts.length} results
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/4 shrink-0 space-y-8">
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sticky top-28">
            <div className="mb-8">
              <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-600" />
                Search
              </h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Find a product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
                Categories
              </h3>
              <div className="flex flex-col gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-cyan-600 border border-transparent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-3/4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 border border-slate-100">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No products found
              </h3>
              <p className="text-slate-500">
                We could not find any products matching your current filters.
                Try adjusting your search or category.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-500/10 transition-all group flex flex-col"
                >
                  <Link
                    href={`/product/${product.id}`}
                    className="block relative aspect-square overflow-hidden bg-slate-50"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider text-slate-700 uppercase border border-slate-200 shadow-sm">
                        {product.category}
                      </span>
                    </div>
                  </Link>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium text-slate-500">
                        4.9
                      </span>
                    </div>

                    <Link href={`/product/${product.id}`}>
                      <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-cyan-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">
                          Price
                        </span>
                        <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                          ${product.price}
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
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-cyan-500" /></div>}>
      <ShopContent />
    </Suspense>
  );
}
