// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Header } from '@/components/ui/Header';   // <-- أضف هذا
import { Footer } from '@/components/ui/Footer';   // <-- أضف هذا

const locales = ['en', 'ar'];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as any)) notFound();
  const messages = await getMessages({ locale });
  const isRtl = locale === 'ar';

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div dir={isRtl ? 'rtl' : 'ltr'} className="flex min-h-screen flex-col">
        <Header />          {/* <-- أضف هذا */}
        <main className="flex-1">{children}</main>   {/* <-- لف المحتوى بـ main */}
        <Footer />          {/* <-- أضف هذا */}
      </div>
    </NextIntlClientProvider>
  );
}