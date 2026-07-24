-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('FULL', 'CONFIG', 'CUSTOM');

-- AlterTable
ALTER TABLE "company_backups" ADD COLUMN     "restoredAt" TIMESTAMP(3),
ADD COLUMN     "restoredById" TEXT,
ADD COLUMN     "type" "BackupType" NOT NULL DEFAULT 'FULL';
