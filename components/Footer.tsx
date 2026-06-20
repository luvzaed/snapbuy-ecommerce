'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Github,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { Product } from '@/lib/types';

export default function Footer() {
  const pathname = usePathname(); // Real categories pulled from the catalog so the Mağaza links always reflect
  // what's actually in the store (and link to the matching shop filter).

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: Product[]) => {
        if (!Array.isArray(data)) return;
        const unique = Array.from(
          new Set(data.map((p) => p.category).filter(Boolean)),
        ) as string[];
        setCategories(unique.slice(0, 6));
      })
      .catch((err) => console.error('Failed to load footer categories:', err));
  }, []); // Admin area has its own dedicated layout — hide the storefront footer there

  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-white/[0.07] bg-slate-100 dark:bg-[#030712] relative overflow-hidden">
      {/* Subtle gradient top */}{' '}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />{' '}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {' '}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}{' '}
          <div className="col-span-1 md:col-span-2">
            {' '}
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 mb-5 group"
            >
              {' '}
              <span className="text-xl font-bold tracking-tight">
                <span className="text-gradient">Snap</span>{' '}
                <span className="text-slate-900 dark:text-white">Buy</span>{' '}
              </span>{' '}
            </Link>{' '}
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xs leading-relaxed">
              Premium teknoloji adresiniz. Modern yaşam için özenle seçilmiş
              elektronik ürünleri, giyilebilir teknolojileri ve aksesuarları
              keşfedin.{' '}
            </p>{' '}
            <div className="flex items-center gap-3 mt-7">
              {' '}
              {[Github, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl glass-light flex items-center justify-center text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 hover:border-cyan-500/30 transition-all duration-200 hover:scale-110"
                >
                  <Icon className="w-4 h-4" />{' '}
                </a>
              ))}{' '}
            </div>
            {/* Contact info */}{' '}
            <div className="flex flex-col gap-2 mt-5">
              {' '}
              {[
                { Icon: Mail, text: 'zaid.alaa@ogr.gelisim.edu.tr' },
                { Icon: Phone, text: '0555 170 27 40' },
                { Icon: MapPin, text: 'İstanbul, Türkiye' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  {' '}
                  <Icon className="w-4 h-4 text-slate-500 dark:text-slate-500 flex-shrink-0" />{' '}
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {text}
                  </span>{' '}
                </div>
              ))}{' '}
            </div>{' '}
          </div>
          {/* Shop */}{' '}
          <div>
            {' '}
            <h4 className="text-slate-900 dark:text-white font-semibold text-sm mb-5 uppercase tracking-wider">
              Mağaza
            </h4>{' '}
            <ul className="space-y-3">
              {/* All products */}{' '}
              <li>
                {' '}
                <Link
                  href="/shop"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-200"
                >
                  Tüm Ürünler{' '}
                </Link>{' '}
              </li>{' '}
              {/* Real categories — each links to its shop filter */}{' '}
              {categories.map((cat) => (
                <li key={cat}>
                  {' '}
                  <Link
                    href={`/shop?category=${encodeURIComponent(cat)}`}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-200 capitalize"
                  >
                    {cat}{' '}
                  </Link>{' '}
                </li>
              ))}{' '}
            </ul>{' '}
          </div>
          {/* Company */}{' '}
          <div>
            {' '}
            <h4 className="text-slate-900 dark:text-white font-semibold text-sm mb-5 uppercase tracking-wider">
              Şirket
            </h4>{' '}
            <div className="flex flex-col gap-4">
              {/* Hakkımızda — about box */}{' '}
              <div>
                {' '}
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Hakkımızda
                </p>{' '}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-3 py-2.5">
                  {' '}
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Güvenli alışveriş, hızlı teslimat ve yapay zeka destekli
                    görsel arama ile e-ticaret deneyimini yeniden tanımlayan
                    platform..{' '}
                  </p>{' '}
                </div>{' '}
              </div>
              {/* Destek — with phone number */}{' '}
              <div>
                {' '}
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Destek
                </p>{' '}
                <div className="flex items-center gap-2">
                  {' '}
                  <Phone className="w-4 h-4 text-slate-500 dark:text-slate-500 flex-shrink-0" />{' '}
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    0555 170 27 40
                  </span>{' '}
                </div>{' '}
              </div>{' '}
            </div>{' '}
          </div>{' '}
        </div>
        {/* Bottom */}{' '}
        <div className="border-t border-slate-200 dark:border-white/[0.07] mt-12 pt-7 flex items-center justify-center">
          {' '}
          <p className="text-slate-500 dark:text-slate-600 text-sm">
            © 2026 SnapBuy. Tüm hakları saklıdır.
          </p>{' '}
        </div>{' '}
      </div>{' '}
    </footer>
  );
}
