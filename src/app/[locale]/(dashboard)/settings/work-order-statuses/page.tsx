'use client';

import { useTranslations } from 'next-intl';
import { AdminGuard } from '@/lib/client-guard';
import { LookupPage } from '@/components/settings/LookupPage';
import { Circle } from 'lucide-react';

export default function WorkOrderStatusesPage() {
  const t = useTranslations('WorkOrderStatuses');

  return (
    <AdminGuard>
      <LookupPage
        title={t('title')}
        description={t('subtitle')}
        apiEndpoint="/api/work-order-statuses"
        icon={Circle}
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