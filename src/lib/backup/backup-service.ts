// src/lib/backup/backup-service.ts
import { prisma } from "@/lib/prisma";
import { BackupRepository } from "./backup-repository";
import { BackupExporter } from "./backup-exporter";
import { StorageProvider } from "./storage-provider";
import { logBackupEvent } from "./audit-logger";
import { BackupType, VALID_BACKUP_TYPES, BackupStatus } from "./types";

export class BackupService {
  constructor(
    private repository: BackupRepository,
    private exporter: BackupExporter,
    private storage: StorageProvider
  ) {}

  async createBackup(params: {
    companyId: string;
    type: BackupType;
    userId: string;
    userEmail: string;
  }): Promise<{ id: string; status: BackupStatus }> {
    // 1. التحقق من صحة النوع
    if (!VALID_BACKUP_TYPES.includes(params.type)) {
      throw new Error(`Invalid backup type: ${params.type}`);
    }

    // 2. التحقق من وجود الشركة
    const company = await this.repository.getCompany(params.companyId);
    if (!company) {
      throw new Error("Company not found");
    }

    // 3. إنشاء سجل PENDING
    const fileName = `backup-${params.companyId}-${Date.now()}.json.gz`;
    const { id: backupId } = await this.repository.createBackupRecord({
      companyId: params.companyId,
      fileName,
      status: "PROCESSING",
      createdById: params.userId,
    });

    // تسجيل بدء العملية (خارج المعاملة)
    await logBackupEvent({
      backupId,
      companyId: params.companyId,
      userId: params.userId,
      userEmail: params.userEmail,
      action: "BACKUP_CREATED",
      status: "PROCESSING",
      fileName,
      type: params.type,
      metadata: { message: "Backup process started" },
    });

    try {
      // 4. تصدير البيانات
      const buffer = await this.exporter.exportToBuffer(
        params.companyId,
        params.type
      );

      // 5. رفع الملف
      const fileUrl = await this.storage.upload(buffer, fileName);

      // 6. تحديث السجل والتسجيل (معاملة قصيرة)
      await prisma.$transaction(async (tx) => {
        await tx.companyBackup.update({
          where: { id: backupId },
          data: {
            status: "COMPLETED",
            fileUrl,
            fileSize: buffer.length,
          },
        });

        // تسجيل الإكمال داخل المعاملة
        await logBackupEvent({
          backupId,
          companyId: params.companyId,
          userId: params.userId,
          userEmail: params.userEmail,
          action: "BACKUP_COMPLETED",
          status: "COMPLETED",
          fileName,
          fileSize: buffer.length,
          type: params.type,
          tx, // تمرير المعاملة
        });
      });

      return { id: backupId, status: "COMPLETED" };
    } catch (error) {
      // 7. في حالة الفشل (معاملة قصيرة)
      await prisma.$transaction(async (tx) => {
        await tx.companyBackup.update({
          where: { id: backupId },
          data: { status: "FAILED" },
        });

        await logBackupEvent({
          backupId,
          companyId: params.companyId,
          userId: params.userId,
          userEmail: params.userEmail,
          action: "BACKUP_FAILED",
          status: "FAILED",
          error: (error as Error).message,
          tx, // تمرير المعاملة
        });
      });

      throw error;
    }
  }
}