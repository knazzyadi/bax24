// src/app/[locale]/(dashboard)/super-admin/backups/types.ts

export interface Company {
  id: string;
  name: string;
}

// ✅ نوع موحد للنسخ الاحتياطية (يجمع بين Backup و BackupRecord)
export interface Backup {
  id: string;
  companyId: string;
  companyName?: string;              // من BackupRecord (للجدول)
  company: { name: string };        // من Backup (لـ ClientWrapper)
  fileName: string;
  fileUrl?: string;                 // من BackupRecord
  fileSize?: number | null;         // دعم كلتا الصيغتين
  status: string | 'PROCESSING' | 'COMPLETED' | 'FAILED'; // دعم كلتا الصيغتين
  createdById: string;              // من BackupRecord
  createdBy?: string | { name: string; email: string }; // دعم كلتا الصيغتين
  createdAt: string;
}

// ✅ نوع مختصر للإرسال عند إنشاء نسخة
export interface CreateBackupPayload {
  companyId: string;
  type?: 'full' | 'config';
}

// ✅ (اختياري) يمكن الاحتفاظ بـ BackupRecord كمرادف لـ Backup للتوافق مع الكود القديم
export type BackupRecord = Backup;