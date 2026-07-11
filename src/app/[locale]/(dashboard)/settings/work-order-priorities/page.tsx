'use client';

import { useTranslations } from 'next-intl';
import { AdminGuard } from '@/lib/client-guard';
import { LookupPage } from '@/components/settings/LookupPage';
import { Flag } from 'lucide-react';

export default function WorkOrderPrioritiesPage() {
  const t = useTranslations('WorkOrderPriorities');

  return (
    <AdminGuard>
      <LookupPage
        title={t('title')}
        description={t('subtitle')}
        apiEndpoint="/api/work-order-priorities"
        icon={Flag}
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