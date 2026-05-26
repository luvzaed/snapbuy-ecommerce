'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  // Admin area has its own dedicated layout — hide the storefront footer there
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-white/[0.07] bg-slate-100 dark:bg-[#030712] relative overflow-hidden">
      {/* Subtle gradient top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <span className="text-xl font-bold tracking-tight">
                <span className="text-gradient">Snap</span>
                <span className="text-slate-900 dark:text-white">Buy</span>
              </span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xs leading-relaxed">
              Premium teknoloji adresiniz. Modern yaşam için özenle seçilmiş elektronik ürünleri, giyilebilir teknolojileri ve aksesuarları keşfedin.
            </p>
            <div className="flex items-center gap-3 mt-7">
              {[Github, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl glass-light flex items-center justify-center text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 hover:border-cyan-500/30 transition-all duration-200 hover:scale-110"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-semibold text-sm mb-5 uppercase tracking-wider">Mağaza</h4>
            <ul className="space-y-3">
              {["Elektronik", "Giyilebilir", "Oyun", "Ses", "Fotoğraf", "Bilgisayar"].map((cat) => (
                <li key={cat}>
                  <a
                    href="#"
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-200"
                  >
                    {cat}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-semibold text-sm mb-5 uppercase tracking-wider">Şirket</h4>
            <ul className="space-y-3">
              {[
                { label: "Hakkımızda", href: "#" },
                { label: "Kariyer", href: "#" },
                { label: "Gizlilik Politikası", href: "#" },
                { label: "Hizmet Şartları", href: "#" },
                { label: "Destek", href: "#" },
                { label: "Giriş", href: "/login" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-200 dark:border-white/[0.07] mt-12 pt-7 flex items-center justify-center">
          <p className="text-slate-500 dark:text-slate-600 text-sm">© 2026 SnapBuy. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
