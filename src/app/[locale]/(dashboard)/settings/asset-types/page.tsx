'use client';

import { useTranslations } from 'next-intl';
import { AdminGuard } from '@/lib/client-guard';
import { LookupPage } from '@/components/settings/LookupPage';
import { Tag } from 'lucide-react';

export default function AssetTypesPage() {
  const t = useTranslations('AssetTypes'); // استخدم الترجمة الخاصة بأنواع الأصول

  return (
    <AdminGuard>
      <LookupPage
        title={t('title')}                  // ← مترجم
        description={t('subtitle')}         // ← مترجم
        apiEndpoint="/api/asset-types"
        icon={Tag}
        features={{
          enableCode: true,
          enableEnglishName: true,
          enableColor: false,
          enableDefault: true,
          enableActive: true,
          enableSorting: true,
          enableSearch: true,
        }}
        permissions={{
          create: true,
          update: true,
          delete: true,
        }}
        confirmDelete={true}
      />
    </AdminGuard>
  );
}