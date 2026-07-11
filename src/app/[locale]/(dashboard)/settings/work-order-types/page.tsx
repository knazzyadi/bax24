'use client';

import { useTranslations } from 'next-intl';
import { AdminGuard } from '@/lib/client-guard';
import { LookupPage } from '@/components/settings/LookupPage';
import { ClipboardList } from 'lucide-react';

export default function WorkOrderTypesPage() {
  const t = useTranslations('WorkOrderTypes');

  return (
    <AdminGuard>
      <LookupPage
        title={t('title')}
        description={t('subtitle')}
        apiEndpoint="/api/work-order-types"
        icon={ClipboardList}
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