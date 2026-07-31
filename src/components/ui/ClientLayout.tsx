'use client';

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

interface ClientLayoutProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function ClientLayout({ children, session }: ClientLayoutProps) {
  const pathname = usePathname();

  // إخفاء الهيدر والفوتر في صفحات السوبر أدمن، صفحات الأدمن العادية، وصفحات المواقع
  const isHiddenPage =
    pathname?.includes('/super-admin') ||
    pathname?.includes('/dashboard') ||
    pathname?.includes('/locations');

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen flex-col bg-background text-foreground flex">
        {!isHiddenPage && <Header />}
        <main className={`flex-1 ${!isHiddenPage ? 'pt-20' : ''}`}>
          {children}
        </main>
        {!isHiddenPage && <Footer />}
      </div>
    </SessionProvider>
  );
}