'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, Loader2, Plus, Package, Truck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Product } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    category: '',
    stock: '',
  });

  const [status, setStatus] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', price: '', description: '', image: '', category: '', stock: '' });
        setEditingId(null);
        fetchProducts();
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      image: product.image,
      category: product.category,
      stock: product.stock.toString(),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', description: '', image: '', category: '', stock: '' });
  };

  // Guard: redirect non-admin users
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center mb-6">
          <Package className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Please log in to access this page.</p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-all"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center justify-center mb-6">
          <Package className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Admin Only</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">You don&apos;t have permission to access the admin panel.</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
        Admin <span className="text-gradient">Dashboard</span>
      </h1>

      {/* Admin Navigation */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm shadow-lg shadow-indigo-500/20"
        >
          <Package className="w-4 h-4" />
          Products
        </Link>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
        >
          <Truck className="w-4 h-4" />
          Manage Orders
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Form */}
        <div className="lg:col-span-1 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit sticky top-24">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white text-center border-b border-slate-100 dark:border-slate-800 pb-4">
            {editingId ? '✏️ Edit Product' : '✨ Add New Product'}
          </h2>

          {status === 'success' && (
            <div className="mb-6 p-4 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center font-medium transition-all">
              {editingId ? 'Product updated successfully!' : 'Product added successfully!'}
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 p-4 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800 text-center font-medium transition-all">
              Failed to save product. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Product Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Wireless Headphones" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Price ($)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} required placeholder="199" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Stock</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="50" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Category</label>
              <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="e.g. Electronics" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Image URL</label>
              <input type="url" name="image" value={formData.image} onChange={handleChange} required placeholder="https://..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describe the product..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all resize-none"></textarea>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={status === 'loading'} className="flex-1 gradient-brand text-white font-bold py-3.5 px-6 rounded-xl hover:opacity-90 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2">
                {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? 'Save Changes' : <><Plus className="w-5 h-5" /> Add Product</>)}
              </button>

              {editingId && (
                <button type="button" onClick={cancelEdit} className="px-4 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium transition-all">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Products List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" />
              Current Products
            </h2>
            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-semibold border border-indigo-200 dark:border-indigo-800">
              Total: {products.length}
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400">
              No products yet. Use the form to add your first product!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all group">

                  <div className="flex items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                    <div className="flex-1">
                      <h3 className="text-slate-900 dark:text-white font-bold text-md line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{product.name}</h3>
                      <div className="text-sm font-black text-gradient mt-1">
                        ${product.price}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-2 text-xs">
                      <span className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Stock: {product.stock}</span>
                      <span className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[80px]">{product.category}</span>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(product)} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500 dark:hover:bg-blue-500 hover:text-white dark:hover:text-white rounded-lg transition-all" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 hover:bg-rose-500 dark:hover:bg-rose-500 hover:text-white dark:hover:text-white rounded-lg transition-all" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
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