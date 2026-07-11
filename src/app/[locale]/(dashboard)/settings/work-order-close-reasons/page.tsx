'use client';

import { useTranslations } from 'next-intl';
import { AdminGuard } from '@/lib/client-guard';
import { LookupPage } from '@/components/settings/LookupPage';
import { CheckCircle } from 'lucide-react';

export default function WorkOrderCloseReasonsPage() {
  const t = useTranslations('WorkOrderCloseReasons');

  return (
    <AdminGuard>
      <LookupPage
        title={t('title')}
        description={t('subtitle')}
        apiEndpoint="/api/work-order-close-reasons"
        icon={CheckCircle}
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