export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  reviewCount?: number;
  rating?: number;
}

export interface User {
  id: number;
  name?: string;
  email: string;
  role: 'user' | 'admin' | string;
}

export interface OrderItem {
  id?: string | number;
  product: Product;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string | number;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
