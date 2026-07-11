'use client';

import { useTranslations } from 'next-intl';
import { AdminGuard } from '@/lib/client-guard';
import { LookupPage } from '@/components/settings/LookupPage';
import { XCircle } from 'lucide-react';

export default function WorkOrderCancelReasonsPage() {
  const t = useTranslations('WorkOrderCancelReasons');

  return (
    <AdminGuard>
      <LookupPage
        title={t('title')}
        description={t('subtitle')}
        apiEndpoint="/api/work-order-cancel-reasons"
        icon={XCircle}
        features={{
          enableCode: true,
          enableEnglishName: true,
          enableColor: false,        // ❌ لا نريد عرض اللون (حسب رغبتك)
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