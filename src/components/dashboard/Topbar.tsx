// src/components/dashboard/Topbar.tsx
'use client';

import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from 'next-intl';

export default function Topbar() {
  const { data: session } = useSession();
  const t = useTranslations('Dashboard');
  const locale = useLocale();

  // اختيار اسم الشركة حسب اللغة
  const companyName = locale === 'ar'
    ? session?.user?.companyName
    : (session?.user?.companyNameEn || session?.user?.companyName);

  const userName = session?.user?.name || '';

  return (
    <div className="h-14 flex items-center justify-between px-4 bg-background">
      <div className="text-sm text-muted-foreground">
        {t('header.title')}   {/* ✅ تم التعديل هنا */}
      </div>

      <div className="text-sm font-medium">
        {companyName && `${companyName} - `}{userName}
      </div>
    </div>
  );
}