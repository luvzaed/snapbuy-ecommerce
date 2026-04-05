'use client';

import { useAuth } from '@/lib/auth-context';
import { ShoppingCart, Check } from 'lucide-react';
import { useState } from 'react';
import { Product } from '@/lib/types';

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useAuth();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={product.stock === 0}
      className={`flex-1 flex items-center justify-center gap-3 font-bold py-4 px-8 rounded-xl transition-all duration-300 ${
        added
          ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
          : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/30'
      } disabled:opacity-50 disabled:scale-100 cursor-pointer`}
    >
      {added ? (
        <>
          <Check className="w-5 h-5" />
          Added to Cart!
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </>
      )}
    </button>
  );
}
