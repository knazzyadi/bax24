// src/lib/backup/audit-logger.ts

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ============================================================
// واجهة بيانات سجل التدقيق
// ============================================================

export interface AuditLogData {
  entityType: string;
  entityId: string;
  companyId: string;
  userId: string;
  userEmail: string;
  action: string;
  metadata?: Prisma.InputJsonObject;
}

// ============================================================
// دالة مركزية لإنشاء سجل تدقيق (داخل معاملة أو بدونها)
// ============================================================

export async function createAuditLog(
  data: AuditLogData,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;

  const metadata: Prisma.InputJsonObject = data.metadata ?? {};

  return client.auditLog.create({
    data: {
      entityType: data.entityType,
      entityId: data.entityId,
      companyId: data.companyId,
      userId: data.userId,
      userEmail: data.userEmail,
      action: data.action,
      metadata,
    },
  });
}

// ============================================================
// دالة مساعدة لتسجيل أحداث النسخ الاحتياطي
// ============================================================

export interface LogBackupEventParams {
  backupId: string;
  companyId: string;
  userId: string;
  userEmail: string;
  action: string;

  status?: string;
  fileName?: string;
  fileSize?: number;
  type?: string;
  error?: string;

  metadata?: Prisma.InputJsonObject;

  tx?: Prisma.TransactionClient;
}

export async function logBackupEvent(
  params: LogBackupEventParams
) {
  const {
    backupId,
    companyId,
    userId,
    userEmail,
    action,
    status,
    fileName,
    fileSize,
    type,
    error,
    metadata,
    tx,
  } = params;

  const fullMetadata: Prisma.InputJsonObject = {
    backupId,

    ...(status !== undefined && { status }),

    ...(fileName !== undefined && {
      fileName,
    }),

    ...(fileSize !== undefined && {
      fileSize,
    }),

    ...(type !== undefined && {
      type,
    }),

    ...(error !== undefined && {
      error,
    }),

    ...(metadata ?? {}),
  };

  return createAuditLog(
    {
      entityType: "CompanyBackup",
      entityId: backupId,
      companyId,
      userId,
      userEmail,
      action,
      metadata: fullMetadata,
    },
    tx
  );
}