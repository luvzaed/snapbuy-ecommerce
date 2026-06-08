import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/components/ThemeProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SnapBuy — Premium Teknoloji Mağazası',
  description:
    'SnapBuy ile en yeni teknoloji ürünlerini keşfedin. Elektronik, giyilebilir cihazlar, oyun ekipmanları ve daha fazlası.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      data-scroll-behavior="smooth"
      className={inter.variable}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col transition-colors duration-300"
      >
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster position="bottom-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}