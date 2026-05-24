import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast'; // Imported the Toaster component

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SnapBuy — Premium Tech Store', // Updated to your new brand name
  description:
    'Discover the latest tech products at SnapBuy. Electronics, wearables, gaming gear and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-[#0f0f1a] text-slate-100 min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>

        {/* Added the Toaster component to render notifications globally */}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
