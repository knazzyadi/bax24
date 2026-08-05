// src/app/[locale]/layout.tsx

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

// ✅ اللغات المدعومة
const locales = ['en', 'ar'] as const;

type Locale = (typeof locales)[number];

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // ✅ التحقق من اللغة
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // ✅ تحميل الترجمات
  const messages = await getMessages({ locale });

  // ✅ تحديد اتجاه الصفحة
  const isRtl = locale === 'ar';

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="flex min-h-screen flex-col"
      >
        <Header />

        <main className="flex-1">
          {children}
        </main>

        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}