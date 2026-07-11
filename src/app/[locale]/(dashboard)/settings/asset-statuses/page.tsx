'use client';

import { useTranslations } from 'next-intl';
import { AdminGuard } from '@/lib/client-guard';
import { LookupPage } from '@/components/settings/LookupPage';
import { Palette } from 'lucide-react';

export default function AssetStatusesPage() {
  const t = useTranslations('AssetStatuses');

  return (
    <AdminGuard>
      <LookupPage
        title={t('title')}
        description={t('subtitle')}
        apiEndpoint="/api/asset-statuses"
        icon={Palette}
        features={{
          enableCode: true,
          enableEnglishName: true,
          enableColor: true,
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