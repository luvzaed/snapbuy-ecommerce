'use client';

import { useState, useEffect, useRef } from 'react'; // CHANGED: added useRef for file input
import { Edit2, Trash2, Loader2, Plus, Package, Upload, X, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from '@/lib/types';

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    // REMOVED: image field no longer stored as text URL in state
    category: '',
    stock: '',
  });

  // NEW: State for the selected image file and its preview URL
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // NEW: When editing, store the current product's existing image path
  const [existingImage, setExistingImage] = useState<string | null>(null);
  // NEW: Ref for the file input so we can reset it programmatically
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');

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
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (!user || user.role !== 'admin') return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // NEW: Handle image file selection — creates a preview URL using URL.createObjectURL()
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create a temporary browser URL for live preview
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // NEW: Clear the selected image file and preview
  const clearImageSelection = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview); // Free memory
    }
    setImagePreview(null);
    // Reset the file input element so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // CHANGED: Now sends FormData (not JSON) so the image file is included in the request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';

    // NEW: Build FormData instead of JSON body
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('price', formData.price);
    submitData.append('description', formData.description);
    submitData.append('category', formData.category);
    submitData.append('stock', formData.stock);

    // Only append the image if a new file was selected
    // For add: image is required. For edit: image is optional (keeps existing if not changed)
    if (imageFile) {
      submitData.append('image', imageFile);
    }

    // For add mode, require an image
    if (!editingId && !imageFile) {
      setStatus('error');
      return;
    }

    try {
      const res = await fetch(url, {
        method,
        // CHANGED: Do NOT set Content-Type header — browser sets it automatically with boundary for FormData
        body: submitData,
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', price: '', description: '', category: '', stock: '' });
        // NEW: Reset image state after successful submission
        clearImageSelection();
        setExistingImage(null);
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

  // CHANGED: Now also sets existingImage for the current product's image so it can be previewed during edit
  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      category: product.category,
      stock: product.stock.toString(),
    });
    // NEW: Show the current product image as existing image preview
    setExistingImage(product.image);
    // Clear any previously selected new file
    clearImageSelection();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // CHANGED: Also resets image-related state
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', description: '', category: '', stock: '' });
    clearImageSelection();
    setExistingImage(null);
  };

  // Guard: redirect non-admin users
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center mb-6">
          <Package className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Erişim Engellendi</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Bu sayfaya erişmek için lütfen giriş yapın.</p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-all"
        >
          Giriş Yap
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
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Sadece Yönetici</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Yönetici paneline erişim izniniz yok.</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-all"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Ürün <span className="text-gradient">Yönetimi</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Mağaza ürünlerini ekle, düzenle ve yönet
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Form */}
        <div className="lg:col-span-1 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white text-center border-b border-slate-100 dark:border-slate-800 pb-4">
            {editingId ? '✏️ Ürünü Düzenle' : 'Yeni Ürün Ekle'}
          </h2>

          {status === 'success' && (
            <div className="mb-6 p-4 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center font-medium transition-all">
              {editingId ? 'Ürün başarıyla güncellendi!' : 'Ürün başarıyla eklendi!'}
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 p-4 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800 text-center font-medium transition-all">
              Ürün kaydedilemedi. Lütfen tekrar deneyin.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Ürün Adı</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Wireless Headphones" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Fiyat (₺)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} required placeholder="199" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Stok</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="50" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Kategori</label>
              <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="e.g. Electronics" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all" />
            </div>

            {/* CHANGED: Replaced text URL input with file upload area */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Ürün Görseli {editingId ? '(değiştirmek isterseniz seçin)' : ''}
              </label>

              {/* Show existing image when editing (only if no new file selected) */}
              {editingId && existingImage && !imagePreview && (
                <div className="mb-3 relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={existingImage}
                    alt="Current product image"
                    fill
                    sizes="300px"
                    className="object-contain"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                    Mevcut görsel
                  </div>
                </div>
              )}

              {/* Show live preview of newly selected image */}
              {imagePreview && (
                <div className="mb-3 relative w-full h-40 rounded-xl overflow-hidden border border-indigo-300 dark:border-indigo-700 bg-slate-100 dark:bg-slate-800">
                  {/* Using img instead of Image here because the src is a blob URL */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="New image preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearImageSelection}
                    className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
                    title="Seçimi kaldır"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-indigo-600/80 text-white text-xs px-2 py-1 rounded-md">
                    Yeni görsel
                  </div>
                </div>
              )}

              {/* File input styled as a drop zone */}
              <label className="flex flex-col items-center justify-center w-full py-4 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {imageFile ? imageFile.name : 'Görsel seçmek için tıklayın'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Açıklama</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describe the product..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all resize-none"></textarea>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={status === 'loading'} className="flex-1 gradient-brand text-white font-bold py-3.5 px-6 rounded-xl hover:opacity-90 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2">
                {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? 'Değişiklikleri Kaydet' : <><Plus className="w-5 h-5" /> Ürün Ekle</>)}
              </button>

              {editingId && (
                <button type="button" onClick={cancelEdit} className="px-4 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium transition-all">
                  İptal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Products List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" />
              Mevcut Ürünler
            </h2>
            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-semibold border border-indigo-200 dark:border-indigo-800">
              {productSearch
                ? `${filteredProducts.length} / ${products.length}`
                : `Toplam: ${products.length}`}
            </span>
          </div>

          {/* Search within products list */}
          <div className="relative mb-6 px-2">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Ürün adına göre ara..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-all shadow-sm"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400">
              {products.length === 0
                ? 'Henüz ürün yok. İlk ürününüzü eklemek için formu kullanın!'
                : `"${productSearch}" ile eşleşen ürün bulunamadı.`}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all group">

                  <div className="flex items-start gap-4">
                    <div className="relative w-20 h-20 overflow-hidden rounded-xl flex-shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-slate-900 dark:text-white font-bold text-md line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{product.name}</h3>
                      <div className="text-sm font-black text-gradient mt-1">
                        ₺{product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-2 text-xs">
                      <span className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Stok: {product.stock}</span>
                      <span className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[80px]">{product.category}</span>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(product)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-all" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all" title="Delete">
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