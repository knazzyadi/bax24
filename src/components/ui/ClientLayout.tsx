'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // إخفاء الهيدر والفوتر في صفحات السوبر أدمن وصفحات الأدمن العادية
  const isHiddenPage = pathname?.includes('/super-admin') || pathname?.includes('/dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!isHiddenPage && <Header />}
      <main className={`flex-1 ${!isHiddenPage ? 'pt-20' : ''}`}>
        {children}
      </main>
      {!isHiddenPage && <Footer />}
    </div>
  );
}