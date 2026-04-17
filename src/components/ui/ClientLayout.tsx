'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSuperAdminPage = pathname?.includes('/super-admin');

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!isSuperAdminPage && <Header />}
      <main className={`flex-1 ${!isSuperAdminPage ? 'pt-20' : ''}`}>
        {children}
      </main>
      {!isSuperAdminPage && <Footer />}
    </div>
  );
}