// src/lib/backup/backup-repository.ts

import { prisma } from "@/lib/prisma";
import type { BackupStatus, Company } from "@prisma/client";

export interface BackupRepository {
  createBackupRecord(params: {
    companyId: string;
    fileName: string;
    status: BackupStatus;
    createdById: string;
  }): Promise<{ id: string }>;

  updateBackupRecord(params: {
    id: string;
    status: BackupStatus;
    fileUrl?: string | null;
    fileSize?: number;
  }): Promise<void>;

  getCompany(companyId: string): Promise<Company | null>;
}

export class PrismaBackupRepository implements BackupRepository {
  async createBackupRecord(params: {
    companyId: string;
    fileName: string;
    status: BackupStatus;
    createdById: string;
  }): Promise<{ id: string }> {
    const backup = await prisma.companyBackup.create({
      data: {
        companyId: params.companyId,
        fileName: params.fileName,
        fileUrl: null,
        fileSize: 0,
        status: params.status,
        createdById: params.createdById,
      },
      select: {
        id: true,
      },
    });

    return {
      id: backup.id,
    };
  }

  async updateBackupRecord(params: {
    id: string;
    status: BackupStatus;
    fileUrl?: string | null;
    fileSize?: number;
  }): Promise<void> {
    await prisma.companyBackup.update({
      where: {
        id: params.id,
      },
      data: {
        status: params.status,
        ...(params.fileUrl !== undefined
          ? { fileUrl: params.fileUrl }
          : {}),
        ...(params.fileSize !== undefined
          ? { fileSize: params.fileSize }
          : {}),
      },
    });
  }

  async getCompany(companyId: string): Promise<Company | null> {
    return prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });
  }
}