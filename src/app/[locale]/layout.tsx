import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ClientLayout } from '@/components/ui/ClientLayout';

// قائمة اللغات المدعومة (يجب أن تطابق ما في middleware.ts)
const locales = ['en', 'ar'];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params; // استخراج اللغة من الـ URL
  if (!locales.includes(locale as any)) notFound();

  const messages = await getMessages({ locale }); // تمرير اللغة لتحميل الترجمة الصحيحة

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ClientLayout>{children}</ClientLayout>
    </NextIntlClientProvider>
  );
}