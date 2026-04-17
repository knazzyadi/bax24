'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';
  const isRTL = locale === 'ar';

  // إخفاء الهيدر في صفحة السوبر أدمن (وأي صفحة تبدأ بـ /super-admin)
  if (pathname?.includes('/super-admin')) {
    return null;
  }

  return (
    <header
      className="
        fixed top-0 inset-x-0 z-50
        bg-background/80 backdrop-blur-md
        border-b border-border
      "
    >
      <div
        className={`
          max-w-7xl mx-auto px-4 sm:px-6
          h-16 flex items-center justify-between
          ${isRTL ? 'flex-row-reverse' : 'flex-row'}
        `}
      >
        {/* LOGO */}
        <Link
          href={`/${locale}`}
          className={`
            flex items-center gap-2 font-bold text-xl text-foreground
            hover:opacity-80 transition
            ${isRTL ? 'flex-row-reverse' : ''}
          `}
          aria-label="Home"
        >
          <Image
            src="/logo.png"
            alt="bax24 logo"
            width={38}
            height={38}
            className="rounded-full border border-border shadow-sm"
            priority
          />

          <span className="tracking-tight">bax24</span>
        </Link>

        {/* ACTIONS */}
        <nav
          className={`
            flex items-center gap-2 sm:gap-3
          `}
          aria-label="Header controls"
        >
          <LocaleSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}