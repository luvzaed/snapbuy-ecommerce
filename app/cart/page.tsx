'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const { cart, removeFromCart, user } = useAuth();
  const router = useRouter();

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-10">
        <ShoppingCart className="w-7 h-7 text-indigo-500" />
        <h1 className="text-3xl font-bold text-slate-900">Shopping Cart</h1>
        <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-sm font-medium">
          {cart.length} {cart.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-16 text-center">
          <ShoppingBag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-slate-500 mb-8">
            Add some amazing products to get started
          </p>
          <Link
            href="/#products"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl gradient-brand text-white font-semibold hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
          >
            Browse Products <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-white border border-slate-200 shadow-sm hover:border-indigo-300 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-slate-900 font-semibold truncate">
                    {item.product.name}
                  </h3>
                  <p className="text-slate-500 text-sm">
                    {item.product.category}
                  </p>
                  <p className="text-indigo-600 font-bold mt-1">
                    ${item.product.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-slate-900 font-bold text-lg">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="mt-2 p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all hover:scale-110"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 h-fit sticky top-20">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Order Summary
            </h2>
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="text-emerald-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (8%)</span>
                <span className="font-medium">
                  ${(total * 0.08).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between text-slate-900 font-bold text-lg">
                <span>Total</span>
                <span className="text-gradient">
                  ${(total * 1.08).toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={() =>
                user ? alert('Order placed! (Demo)') : router.push('/login')
              }
              className="w-full py-4 rounded-xl gradient-brand text-white font-semibold hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
            >
              {user ? 'Place Order' : 'Login to Checkout'}
              <ArrowRight className="w-5 h-5" />
            </button>
            {!user && (
              <p className="text-center text-slate-500 text-xs mt-3">
                <Link
                  href="/login"
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Sign in
                </Link>{' '}
                to complete your purchase
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
