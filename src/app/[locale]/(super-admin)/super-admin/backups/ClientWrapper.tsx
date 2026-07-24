// src/app/[locale]/(super-admin)/super-admin/backups/ClientWrapper.tsx
'use client';

import { useState } from 'react';
import { BackupForm } from './BackupForm';
import { BackupHistoryTable } from './BackupHistoryTable';
import type { Company, Backup } from './types';

interface ClientWrapperProps {
  companies: Company[];
  initialBackups: Backup[];
  locale: string;
}

export default function ClientWrapper({
  companies,
  initialBackups,
  locale,
}: ClientWrapperProps) {
  const [backups, setBackups] = useState<Backup[]>(initialBackups);
  const isRtl = locale === 'ar';

  const handleBackupCreated = (newBackup: Backup) => {
    setBackups((prev) => [newBackup, ...prev]);
  };

  return (
    <div className="space-y-8 p-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {isRtl ? 'النسخ الاحتياطي للشركات' : 'Company Backups'}
        </h1>
      </div>

      <BackupForm
        companies={companies}
        onBackupCreated={handleBackupCreated}
        isRtl={isRtl}
      />

      <BackupHistoryTable
        backups={backups}
        isRtl={isRtl}
      />
    </div>
  );
}