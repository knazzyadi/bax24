// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Toaster } from 'sonner'; // <-- أضف هذا

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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* إضافة مكون Toaster لعرض الإشعارات */}
        <Toaster position="top-center" richColors />
      </div>
    </NextIntlClientProvider>
  );
}