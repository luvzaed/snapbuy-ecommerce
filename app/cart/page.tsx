'use client';

import { useAuth } from '@/lib/auth-context';
import { Product } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, ArrowRight, ShoppingBag, CheckCircle2, Loader2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';

function CartItemRow({ item }: { item: { product: Product; quantity: number } }) {
  const { removeFromCart, updateQuantity } = useAuth();

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:scale-[1.01]"
    >
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.product.image}
          alt={item.product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-slate-900 dark:text-white font-semibold truncate">
          {item.product.name}
        </h3>
        <p className="text-slate-500 text-sm">
          {item.product.category}
        </p>
        <p className="text-indigo-600 font-bold mt-1">
          ${item.product.price.toFixed(2)} each
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-9 text-center text-sm font-bold text-slate-900 dark:text-white tabular-nums">
          {item.quantity}
        </span>
        <button
          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90"
          aria-label="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-slate-900 dark:text-white font-bold text-lg">
          ${(item.product.price * item.quantity).toFixed(2)}
        </p>
        <button
          onClick={() => removeFromCart(item.product.id)}
          className="mt-2 p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-110"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { cart, user, placeOrder, isCheckingOut } = useAuth();
  const router = useRouter();
  const [orderSuccess, setOrderSuccess] = useState(false);

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const success = await placeOrder();
    if (success) {
      setOrderSuccess(true);
      toast.success('Order placed successfully!');
    } else {
      toast.error('Failed to place order. Please try again.');
    }
  };

  // Show success screen after placing order
  if (orderSuccess) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Order Placed Successfully!
          </h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Thank you for your purchase. You can track your order status in your orders page.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/orders"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl gradient-brand text-white font-semibold hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
            >
              View My Orders <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-10">
        <ShoppingCart className="w-7 h-7 text-indigo-500" />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Shopping Cart</h1>
        <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-sm font-medium">
          {cart.length} {cart.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-16 text-center">
          <ShoppingBag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Your cart is empty
          </h2>
          <p className="text-slate-500 mb-8">
            Add some amazing products to get started
          </p>
          <Link
            href="/shop"
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
              <CartItemRow key={item.product.id} item={item} />
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 h-fit sticky top-20">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Order Summary
            </h2>
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal</span>
                <span className="font-medium">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Shipping</span>
                <span className="text-emerald-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Tax (8%)</span>
                <span className="font-medium">
                  ${(total * 0.08).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between text-slate-900 dark:text-white font-bold text-lg">
                <span>Total</span>
                <span className="text-gradient">
                  ${(total * 1.08).toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-4 rounded-xl gradient-brand text-white font-semibold hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : user ? (
                <>
                  Place Order
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Login to Checkout
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
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
