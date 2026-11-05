'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Order, CartItem, Product } from './types';
import toast from 'react-hot-toast';
import { addCartItem, readStoredCart, reconcileCart, requestProducts } from './cart';

// Aliases for missing types
export type AuthOrder = Order;
export type AuthOrderItem = Order['items'][0];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  orders: Order[];
  cart: CartItem[];
  setAuthUser: (user: User) => void;
  logout: () => Promise<void>;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  refreshCart: (signal?: AbortSignal) => Promise<void>;
  cartCount: number;
  fetchOrders: () => Promise<void>;
  placeOrder: (shipping?: Record<string, unknown>, total?: number) => Promise<number>;
  isCheckingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  // True until auth/cart state has been hydrated from localStorage. Protected
  // pages must wait for this to be false before deciding to redirect.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      try {
        const storedCart = localStorage.getItem('shop_cart');
        if (storedCart && active) setCart(readStoredCart(JSON.parse(storedCart)));
      } catch {
        localStorage.removeItem('shop_cart');
      }
      try {
        // localStorage is untrusted; only the server can confirm a valid cookie.
        const response = await fetch('/api/users/me', { cache: 'no-store' });
        if (active && response.ok) {
          const data = await response.json();
          setUser(data.user);
          localStorage.setItem('shop_user', JSON.stringify(data.user));
        } else if (active) {
          setUser(null);
          localStorage.removeItem('shop_user');
        }
      } catch {
        if (active) {
          setUser(null);
          localStorage.removeItem('shop_user');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void hydrate();
    return () => { active = false; };
  }, []);

  const setAuthUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('shop_user', JSON.stringify(userData));
  };

  const logout = async () => {
    const response = await fetch('/api/users/logout', { method: 'POST' });
    if (!response.ok) throw new Error('Could not log out');
    setUser(null);
    setOrders([]);
    setCart([]);
    localStorage.removeItem('shop_user');
    localStorage.removeItem('shop_cart');
  };

  useEffect(() => {
    if (!loading) localStorage.setItem('shop_cart', JSON.stringify(cart));
  }, [cart, loading]);

  const refreshCart = useCallback(async (signal?: AbortSignal) => {
    const products = await requestProducts(signal);
    if (!signal?.aborted) setCart(previous => reconcileCart(previous, products));
  }, []);

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock === 0) toast.error('Bu ürün stokta yok');
    setCart(previous => addCartItem(previous, product, quantity));
  };

  const removeFromCart = (productId: number) => {
    setCart(previous => previous.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (!Number.isSafeInteger(quantity)) return;
    setCart(previous => quantity <= 0 ? previous.filter(item => item.product.id !== productId)
      : previous.map(item => item.product.id === productId
        ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock, 100)) } : item));
  };

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/orders?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, [user]);

  const placeOrder = async (shipping?: Record<string, unknown>, total?: number) => {
    setIsCheckingOut(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity, price: item.product.price })),
          total,
          shipping,
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCart([]);
        localStorage.removeItem('shop_cart');
        await fetchOrders();
        return data.id as number;
      }
      if (res.status === 409 || res.status === 400) await refreshCart();
      const data = await res.json();
      throw new Error(data.error || 'Sipariş oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        orders,
        cart,
        setAuthUser,
        logout,
        addToCart,
        removeFromCart,
        updateQuantity,
        refreshCart,
        cartCount,
        fetchOrders,
        placeOrder,
        isCheckingOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
