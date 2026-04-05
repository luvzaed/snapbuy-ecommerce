"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Order, CartItem, Product } from "./types";

interface AuthContextType {
  user: User | null;
  orders: Order[];
  cart: CartItem[];
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  cartCount: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: (User & { password: string })[] = [
  { id: "1", name: "Admin User", email: "admin@shop.com", password: "admin123", role: "admin" },
  { id: "2", name: "Jane Doe", email: "user@shop.com", password: "user123", role: "user" },
];

const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-001",
    userId: "2",
    products: [],
    total: 749.97,
    status: "delivered",
    createdAt: "2026-02-15T10:00:00Z",
  },
  {
    id: "ORD-002",
    userId: "2",
    products: [],
    total: 299.99,
    status: "shipped",
    createdAt: "2026-03-01T14:00:00Z",
  },
  {
    id: "ORD-003",
    userId: "2",
    products: [],
    total: 1899.99,
    status: "processing",
    createdAt: "2026-03-08T09:00:00Z",
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState(MOCK_USERS);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("shop_user");
    if (stored) setUser(JSON.parse(stored));
    const storedCart = localStorage.getItem("shop_cart");
    if (storedCart) setCart(JSON.parse(storedCart));
  }, []);

  const login = (email: string, password: string): boolean => {
    const found = users.find((u) => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userWithoutPassword } = found;
      setUser(userWithoutPassword);
      localStorage.setItem("shop_user", JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const register = (name: string, email: string, password: string): boolean => {
    if (users.find((u) => u.email === email)) return false;
    const newUser = { id: String(Date.now()), name, email, password, role: "user" as const };
    setUsers((prev) => [...prev, newUser]);
    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem("shop_user", JSON.stringify(userWithoutPassword));
    return true;
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    localStorage.removeItem("shop_user");
    localStorage.removeItem("shop_cart");
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const updated = existing
        ? prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...prev, { product, quantity: 1 }];
      localStorage.setItem("shop_cart", JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.product.id !== productId);
      localStorage.setItem("shop_cart", JSON.stringify(updated));
      return updated;
    });
  };

  const orders = MOCK_ORDERS.filter((o) => user && o.userId === user.id);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AuthContext.Provider
      value={{ user, orders, cart, login, register, logout, addToCart, removeFromCart, cartCount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
