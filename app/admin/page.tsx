'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    category: '',
    stock: '',
  });

  const [status, setStatus] = useState('');
  const [products, setProducts] = useState<any[]>([]);
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
    } catch (error) {
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

  const handleEdit = (product: any) => {
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

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-10 text-white flex items-center gap-3">
        Admin <span className="text-cyan-400">Dashboard</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Form */}
        <div className="lg:col-span-1 p-8 bg-[#0a0f1e]/80 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl h-fit sticky top-24">
          <h2 className="text-2xl font-bold mb-6 text-white text-center border-b border-white/5 pb-4">
            {editingId ? '✏️ Edit Product' : '✨ Add New Product'}
          </h2>

          {status === 'success' && (
            <div className="mb-6 p-4 text-emerald-400 bg-emerald-400/10 rounded-xl border border-emerald-400/20 text-center font-medium transition-all">
              {editingId ? 'Product updated successfully!' : 'Product added successfully!'}
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 p-4 text-rose-400 bg-rose-400/10 rounded-xl border border-rose-400/20 text-center font-medium transition-all">
              Failed to save product. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Product Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Wireless Headphones" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-white placeholder-slate-500 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Price ($)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} required placeholder="199" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-white placeholder-slate-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Stock</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="50" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-white placeholder-slate-500 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Category</label>
              <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="e.g. Electronics" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-white placeholder-slate-500 transition-all" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Image URL</label>
              <input type="url" name="image" value={formData.image} onChange={handleChange} required placeholder="https://..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-white placeholder-slate-500 transition-all" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describe the product..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-white placeholder-slate-500 transition-all resize-none"></textarea>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={status === 'loading'} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3.5 px-6 rounded-xl hover:opacity-90 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2">
                {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? 'Save Changes' : 'Add Product')}
              </button>

              {editingId && (
                <button type="button" onClick={cancelEdit} className="px-4 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Products List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-bold text-white">Current Products</h2>
            <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm font-semibold border border-cyan-500/30">
              Total: {products.length}
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64 bg-[#0a0f1e]/40 backdrop-blur-md rounded-3xl border border-white/5">
              <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="bg-[#0a0f1e]/40 backdrop-blur-md rounded-3xl p-10 border border-white/5 text-center text-slate-400">
              No products yet. Use the form to add your first product!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-[#0a0f1e]/60 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex flex-col gap-4 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all group">

                  <div className="flex items-start gap-4">
                    <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-xl bg-black/50 border border-white/10" />
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-md line-clamp-2 leading-tight group-hover:text-cyan-400 transition-colors">{product.name}</h3>
                      <div className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mt-1">
                        ${product.price}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex gap-2 text-xs">
                      <span className="bg-white/5 px-2 py-1 rounded-md text-slate-300 border border-white/5">Stock: {product.stock}</span>
                      <span className="bg-white/5 px-2 py-1 rounded-md text-slate-300 border border-white/5 truncate max-w-[80px]">{product.category}</span>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(product)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all" title="Delete">
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