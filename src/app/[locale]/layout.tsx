'use client'; // ✅ إضافة هذا السطر

import { NextIntlClientProvider } from 'next-intl';
import { useParams, usePathname } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { useEffect, useState } from 'react';

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const locale = params.locale as string;
  const [messages, setMessages] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch(`/messages/${locale}.json`)
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(() => setMessages({}));
  }, [locale]);

  const isRtl = locale === 'ar';

  if (!messages) return null;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div dir={isRtl ? 'rtl' : 'ltr'} className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}