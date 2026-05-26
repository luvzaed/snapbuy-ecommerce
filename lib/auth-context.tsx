'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Order, CartItem, Product } from './types';
import toast from 'react-hot-toast';

// Aliases for missing types
export type AuthOrder = Order;
export type AuthOrderItem = Order['items'][0];

interface AuthContextType {
  user: User | null;
  orders: Order[];
  cart: CartItem[];
  setAuthUser: (user: User) => void;
  logout: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  cartCount: number;
  fetchOrders: () => Promise<void>;
  placeOrder: (shipping?: Record<string, unknown>, payment?: Record<string, unknown>, total?: number) => Promise<string | false>;
  isCheckingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('shop_user');
      if (storedUser) setUser(JSON.parse(storedUser));
      const storedCart = localStorage.getItem('shop_cart');
      if (storedCart) setCart(JSON.parse(storedCart));
    } catch (error) {
      console.error('Error parsing data from localStorage:', error);
    }
  }, []);

  const setAuthUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('shop_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    localStorage.removeItem('shop_user');
    localStorage.removeItem('shop_cart');
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    // Enforce stock limit: never add more than what's in stock
    if (currentQty >= product.stock) {
      toast.error(
        product.stock > 0
          ? `Stokta yalnızca ${product.stock} adet var`
          : 'Bu ürün stokta yok',
      );
      return;
    }
    setCart((prev) => {
      const ex = prev.find((item) => item.product.id === product.id);
      const updated = ex
        ? prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
              : item,
          )
        : [...prev, { product, quantity: 1 }];
      localStorage.setItem('shop_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.product.id !== productId);
      localStorage.setItem('shop_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        const updated = prev.filter((item) => item.product.id !== productId);
        localStorage.setItem('shop_cart', JSON.stringify(updated));
        return updated;
      }
      const updated = prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(quantity, item.product.stock) }
          : item,
      );
      localStorage.setItem('shop_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const fetchOrders = async () => {
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
  };

  const placeOrder = async (shipping?: Record<string, unknown>, payment?: Record<string, unknown>, total?: number) => {
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
          payment
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCart([]);
        localStorage.removeItem('shop_cart');
        await fetchOrders();
        return data.id || 'ORD-NEW';
      }
      return false;
    } catch (err) {
      console.error('Failed to place order:', err);
      return false;
    } finally {
      setIsCheckingOut(false);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AuthContext.Provider
      value={{
        user,
        orders,
        cart,
        setAuthUser,
        logout,
        addToCart,
        removeFromCart,
        updateQuantity,
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
