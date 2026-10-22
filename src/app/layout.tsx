import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TradeSphere | Next-Gen Institutional Trading Platform',
  description: 'Simulate Indian (NSE/BSE) and Global stock trading with ₹1,00,000 virtual capital, advanced order types, real-time analytics, and Firebase synchronization.',
  keywords: ['Stock Trading', 'Virtual Trading', 'NSE', 'BSE', 'Paper Trading', 'Zerodha', 'TradeSphere', 'Portfolio Tracker'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0a0e17] text-slate-100 antialiased min-h-screen selection:bg-blue-600 selection:text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
