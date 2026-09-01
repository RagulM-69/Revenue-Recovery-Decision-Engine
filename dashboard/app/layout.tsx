import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Revenue Recovery Decision Engine',
  description: 'Automated ML & Deterministic Policy Payment Recovery Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased min-h-screen flex`}>
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
