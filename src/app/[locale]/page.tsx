'use client';

import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocaleSwitcher } from '@/components/locale-switcher';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function HomePage() {
  const params = useParams();
  const locale = params?.locale as string;
  const t = useTranslations('Landing');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-bold">bax24</h1>
        <div className="flex gap-4">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-4xl md:text-6xl font-bold mb-4">{t('title')}</h2>
        <p className="text-xl text-muted-foreground mb-8">{t('subtitle')}</p>
        <Link
          href={`/${locale}/login`}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg text-lg font-semibold hover:opacity-90 transition"
        >
          {t('login')}
        </Link>
      </main>
    </div>
  );
}