'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  CreditCard,
  ClipboardCheck,
  Loader2,
  ShieldCheck,
  Truck,
  Lock,
  CheckCircle2,
  Package,
  User,
  Phone,
  Home,
  Building2,
  Hash,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Teslimat', icon: MapPin },
  { id: 2, label: 'Ödeme', icon: CreditCard },
  { id: 3, label: 'İnceleme', icon: ClipboardCheck },
];

// Format card number with spaces
function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

// Format expiry as MM/YY with validation (month 01-12)
function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length === 0) return '';

  // Validate month (01-12)
  let month = digits.slice(0, 2);
  if (digits.length === 1) {
    // If first digit is 2-9, auto-prefix with 0 (e.g. "3" → "03")
    if (parseInt(digits[0]) > 1) {
      month = '0' + digits[0];
      const year = digits.slice(1, 3);
      return year ? `${month}/${year}` : month;
    }
    return digits;
  }

  // Clamp month to 01-12
  const monthNum = parseInt(month);
  if (monthNum === 0) month = '01';
  else if (monthNum > 12) month = '12';

  if (digits.length >= 3) return `${month}/${digits.slice(2)}`;
  return month;
}

// --- Reusable input field (defined OUTSIDE the page component to avoid focus loss) ---
function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = 'text',
  maxLength,
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  maxLength?: number;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all ${
            error
              ? 'border-red-400 dark:border-red-600'
              : 'border-slate-200 dark:border-slate-700'
          }`}
        />
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const { user, cart, placeOrder, isCheckingOut } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Shipping form
  const [shipping, setShipping] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'Türkiye',
  });

  // Payment form
  const [payment, setPayment] = useState({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not logged in or cart is empty
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (cart.length === 0) {
      router.push('/cart');
    }
  }, [user, cart, router]);

  // Pre-fill name from user (must be above the early return to preserve hook order)
  useEffect(() => {
    if (user?.name && !shipping.fullName) {
      const timer = setTimeout(() => {
        setShipping((prev) => ({ ...prev, fullName: user?.name || '' }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, shipping.fullName]);

  // Sync checkout steps with browser history (back button goes one step back)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const step = e.state?.checkoutStep;
      if (step && step >= 1 && step <= 3) {
        setErrors({});
        setCurrentStep(step);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Push initial step into history on mount
    if (!window.history.state?.checkoutStep) {
      window.history.replaceState({ checkoutStep: 1 }, '');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!user || cart.length === 0) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // --- Validation ---
  const validateShipping = () => {
    const errs: Record<string, string> = {};
    if (!shipping.fullName.trim()) errs.fullName = 'Ad soyad gerekli';
    if (!shipping.phone.trim()) errs.phone = 'Telefon numarası gerekli';
    if (!shipping.address.trim()) errs.address = 'Adres gerekli';
    if (!shipping.city.trim()) errs.city = 'Şehir gerekli';
    if (!shipping.state.trim()) errs.state = 'İl/İlçe gerekli';
    if (!shipping.zip.trim()) errs.zip = 'Posta kodu gerekli';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePayment = () => {
    const errs: Record<string, string> = {};
    if (!payment.cardName.trim()) errs.cardName = 'Kart üzerindeki isim gerekli';
    const digits = payment.cardNumber.replace(/\s/g, '');
    if (digits.length < 16) errs.cardNumber = 'Geçerli 16 haneli kart numarası girin';
    if (payment.expiry.length < 5) errs.expiry = 'Geçerli son kullanma tarihi girin (AA/YY)';
    if (payment.cvv.length < 3) errs.cvv = 'Geçerli CVV girin';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateShipping()) return;
    if (currentStep === 2 && !validatePayment()) return;
    const nextStep = Math.min(currentStep + 1, 3);
    window.history.pushState({ checkoutStep: nextStep }, '');
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    setErrors({});
    window.history.back();
  };

  const handlePlaceOrder = async () => {
    const success = await placeOrder();
    if (success) {
      toast.success('Siparişiniz başarıyla oluşturuldu!');
      router.push('/order-confirmation');
    } else {
      toast.error('Sipariş oluşturulamadı. Lütfen tekrar deneyin.');
    }
  };


  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/cart"
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Ödeme <span className="text-gradient">İşlemi</span>
        </h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-0 mb-12">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                    isActive
                      ? 'gradient-brand text-white border-transparent shadow-lg shadow-indigo-500/30 scale-110'
                      : isCompleted
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs font-semibold mt-2 transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-16 sm:w-24 h-0.5 mx-3 mb-6 rounded-full transition-colors ${
                    currentStep > step.id
                      ? 'bg-emerald-400 dark:bg-emerald-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Shipping */}
          {currentStep === 1 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm animate-fade-in-up">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-indigo-500" />
                Teslimat Bilgileri
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                Teslimat adresi bilgilerinizi girin
              </p>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InputField
                    label="Ad Soyad"
                    name="fullName"
                    value={shipping.fullName}
                    onChange={(e) =>
                      setShipping({ ...shipping, fullName: e.target.value })
                    }
                    placeholder="John Doe"
                    icon={User}
                    error={errors.fullName}
                  />
                  <InputField
                    label="Telefon Numarası"
                    name="phone"
                    value={shipping.phone}
                    onChange={(e) =>
                      setShipping({ ...shipping, phone: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                    icon={Phone}
                    type="tel"
                    error={errors.phone}
                  />
                </div>

                <InputField
                  label="Adres"
                  name="address"
                  value={shipping.address}
                  onChange={(e) =>
                    setShipping({ ...shipping, address: e.target.value })
                  }
                  placeholder="Mahalle, Cadde/Sokak, No"
                  icon={Home}
                  error={errors.address}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <InputField
                    label="Şehir"
                    name="city"
                    value={shipping.city}
                    onChange={(e) =>
                      setShipping({ ...shipping, city: e.target.value })
                    }
                    placeholder="İstanbul"
                    icon={Building2}
                    error={errors.city}
                  />
                  <InputField
                    label="İl/İlçe"
                    name="state"
                    value={shipping.state}
                    onChange={(e) =>
                      setShipping({ ...shipping, state: e.target.value })
                    }
                    placeholder="NY"
                    icon={MapPin}
                    error={errors.state}
                  />
                  <InputField
                    label="Posta Kodu"
                    name="zip"
                    value={shipping.zip}
                    onChange={(e) =>
                      setShipping({ ...shipping, zip: e.target.value })
                    }
                    placeholder="10001"
                    icon={Hash}
                    error={errors.zip}
                  />
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Truck className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-medium">Ücretsiz Kargo</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-medium">Güvenli Ödeme</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {currentStep === 2 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm animate-fade-in-up">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-indigo-500" />
                Ödeme Bilgileri
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                Kart bilgilerinizi girin (demo — gerçek ödeme alınmaz)
              </p>

              <div className="space-y-5">
                <InputField
                  label="Kart Üzerindeki İsim"
                  name="cardName"
                  value={payment.cardName}
                  onChange={(e) =>
                    setPayment({ ...payment, cardName: e.target.value })
                  }
                  placeholder="John Doe"
                  icon={User}
                  error={errors.cardName}
                />

                <InputField
                  label="Kart Numarası"
                  name="cardNumber"
                  value={payment.cardNumber}
                  onChange={(e) =>
                    setPayment({
                      ...payment,
                      cardNumber: formatCardNumber(e.target.value),
                    })
                  }
                  placeholder="4242 4242 4242 4242"
                  icon={CreditCard}
                  maxLength={19}
                  error={errors.cardNumber}
                />

                <div className="grid grid-cols-2 gap-5">
                  <InputField
                    label="Son Kullanma Tarihi"
                    name="expiry"
                    value={payment.expiry}
                    onChange={(e) =>
                      setPayment({
                        ...payment,
                        expiry: formatExpiry(e.target.value),
                      })
                    }
                    placeholder="MM/YY"
                    icon={CreditCard}
                    maxLength={5}
                    error={errors.expiry}
                  />
                  <InputField
                    label="CVV"
                    name="cvv"
                    value={payment.cvv}
                    onChange={(e) =>
                      setPayment({
                        ...payment,
                        cvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                      })
                    }
                    placeholder="123"
                    icon={Lock}
                    maxLength={4}
                    error={errors.cvv}
                  />
                </div>
              </div>

              {/* Security notice */}
              <div className="mt-8 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-800 dark:text-emerald-300 text-sm font-semibold">
                    Güvenli ve Şifreli
                  </p>
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                    Bu bir demo ödemesidir. Gerçek ödeme işlemi yapılmaz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm animate-fade-in-up">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                <ClipboardCheck className="w-6 h-6 text-indigo-500" />
                Siparişinizi İnceleyin
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                Sipariş vermeden önce bilgilerinizi doğrulayın
              </p>

              {/* Shipping summary */}
              <div className="mb-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    Teslimat Adresi
                  </h3>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                  >
                    Düzenle
                  </button>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm space-y-0.5">
                  <p className="font-medium">{shipping.fullName}</p>
                  <p>{shipping.address}</p>
                  <p>
                    {shipping.city}, {shipping.state} {shipping.zip}
                  </p>
                  <p>{shipping.country}</p>
                  <p className="text-slate-500 dark:text-slate-400">{shipping.phone}</p>
                </div>
              </div>

              {/* Payment summary */}
              <div className="mb-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-500" />
                    Ödeme Yöntemi
                  </h3>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                  >
                    Düzenle
                  </button>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm space-y-0.5">
                  <p className="font-medium">{payment.cardName}</p>
                  <p>
                    •••• •••• •••• {payment.cardNumber.replace(/\s/g, '').slice(-4)}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Son kullanma: {payment.expiry}
                  </p>
                </div>
              </div>

              {/* Items summary */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Package className="w-4 h-4 text-indigo-500" />
                  Sipariş Ürünleri ({itemCount})
                </h3>
                <div className="flex flex-col gap-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 dark:text-white text-sm font-medium truncate">
                          {item.product.name}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">
                          Adet: {item.quantity} × ₺{item.product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <p className="text-slate-900 dark:text-white font-bold text-sm">
                        ₺{(item.product.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Geri
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-brand text-white font-semibold hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
              >
                Devam Et
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={isCheckingOut}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-brand text-white font-semibold hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Sipariş Ver — ₺{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">
              Sipariş Özeti
            </h2>

            {/* Mini cart items */}
            <div className="flex flex-col gap-3 mb-5 max-h-48 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 dark:text-slate-200 text-xs font-medium truncate">
                      {item.product.name}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      x{item.quantity}
                    </p>
                  </div>
                  <p className="text-slate-900 dark:text-white text-xs font-bold">
                    ₺{(item.product.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                <span>Ara Toplam</span>
                <span className="font-medium">₺{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                <span>Kargo</span>
                <span className="text-emerald-600 font-medium">Ücretsiz</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                <span>KDV (%8)</span>
                <span className="font-medium">₺{tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between text-slate-900 dark:text-white font-bold text-lg">
                <span>Toplam</span>
                <span className="text-gradient">₺{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

