'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const t = useTranslations('Dashboard');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`);
    } else if (session?.user?.role === 'SUPER_ADMIN') {
      // توجيه السوبر أدمن إلى صفحته الخاصة
      router.push(`/${locale}/super-admin`);
    }
  }, [status, session, router, locale]);

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
  }

  if (!session) return null;

  // إذا كان المستخدم أدمن شركة أو مشرف أو فني، يتم عرض لوحة التحكم العادية
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4 text-foreground">{t('title')}</h1>
      <p className="text-muted-foreground mb-6">مرحباً {session.user?.name}!</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">{t('facilities')}</h2>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">0</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">{t('maintenance')}</h2>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">0</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">{t('staff')}</h2>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">0</p>
        </div>
      </div>
      <div className="mt-10 p-4 border border-border rounded-lg bg-muted/20 text-center text-muted-foreground">
        {t('comingSoon')}
      </div>
    </div>
  );
}