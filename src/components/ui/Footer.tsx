// src/components/ui/Footer.tsx
'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { publicRoutes } from '@/lib/publicRoutes'; // استيراد المسارات العامة

export function Footer() {
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';
  const isRTL = locale === 'ar';
  const t = useTranslations('Footer');

  // استخراج المسار بعد إزالة الـ locale
  const pathWithoutLocale = pathname?.replace(`/${locale}`, '') || '';
  const cleanPath = pathWithoutLocale.startsWith('/') ? pathWithoutLocale.slice(1) : pathWithoutLocale;

  // التحقق: هل المسار الحالي عام أم لا؟
  const isPublic = publicRoutes.includes(cleanPath);

  // إخفاء الفوتر إذا لم يكن المسار عاماً
  if (!isPublic) {
    return null;
  }

  return (
    <footer className="bg-background py-6 text-xs text-muted-foreground border-t border-border mt-auto">
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