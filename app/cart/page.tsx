"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const { cart, removeFromCart, user } = useAuth();
  const router = useRouter();

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-10">
        <ShoppingCart className="w-7 h-7 text-indigo-400" />
        <h1 className="text-3xl font-bold text-white">Shopping Cart</h1>
        <span className="px-3 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium">
          {cart.length} {cart.length === 1 ? "item" : "items"}
        </span>
      </div>

      {cart.length === 0 ? (
        <div className="gradient-card border border-white/10 rounded-3xl p-16 text-center">
          <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-slate-400 mb-8">Add some amazing products to get started</p>
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
                className="gradient-card border border-white/10 hover:border-indigo-500/30 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#1a1a2e]">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{item.product.name}</h3>
                  <p className="text-slate-400 text-sm">{item.product.category}</p>
                  <p className="text-indigo-400 font-bold mt-1">${item.product.price.toFixed(2)} × {item.quantity}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-bold text-lg">${(item.product.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="mt-2 p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-all hover:scale-110"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="gradient-card border border-white/10 rounded-2xl p-6 h-fit sticky top-20">
            <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping</span>
                <span className="text-green-400">Free</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax (8%)</span>
                <span>${(total * 0.08).toFixed(2)}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between text-white font-bold text-lg">
                <span>Total</span>
                <span className="text-gradient">${(total * 1.08).toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => user ? alert("Order placed! (Demo)") : router.push("/login")}
              className="w-full py-4 rounded-xl gradient-brand text-white font-semibold hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
            >
              {user ? "Place Order" : "Login to Checkout"}
              <ArrowRight className="w-5 h-5" />
            </button>
            {!user && (
              <p className="text-center text-slate-500 text-xs mt-3">
                <Link href="/login" className="text-indigo-400 hover:underline">Sign in</Link> to complete your purchase
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
