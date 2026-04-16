'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function Footer() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const isRTL = locale === 'ar';
  const t = useTranslations('Footer');

  return (
    <footer className="bg-background py-6 text-xs text-muted-foreground">
      <div
        className={`
          max-w-7xl mx-auto px-6
          flex flex-col gap-2 items-center
          ${isRTL ? 'text-right' : 'text-left'}
        `}
      >
        <div className="flex gap-4">
          <Link
            href={`/${locale}/privacy`}
            className="hover:text-foreground transition"
          >
            {t('privacy')}
          </Link>

          <Link
            href={`/${locale}/terms`}
            className="hover:text-foreground transition"
          >
            {t('terms')}
          </Link>
        </div>

        <p>
          © {new Date().getFullYear()} bax24. {t('rights')}
        </p>
      </div>
    </footer>
  );
}