-- CreateEnum
CREATE TYPE "ScheduleRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduleRunType" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateTable
CREATE TABLE "MaintenanceScheduleRun" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "status" "ScheduleRunStatus" NOT NULL DEFAULT 'RUNNING',
    "runType" "ScheduleRunType" NOT NULL DEFAULT 'MANUAL',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "totalAssets" INTEGER NOT NULL DEFAULT 0,
    "succeededAssets" INTEGER NOT NULL DEFAULT 0,
    "failedAssets" INTEGER NOT NULL DEFAULT 0,
    "executedById" TEXT,
    "notes" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceScheduleRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceScheduleRun_workOrderId_key" ON "MaintenanceScheduleRun"("workOrderId");

-- CreateIndex
CREATE INDEX "MaintenanceScheduleRun_scheduleId_startedAt_idx" ON "MaintenanceScheduleRun"("scheduleId", "startedAt");

-- CreateIndex
CREATE INDEX "MaintenanceScheduleRun_status_idx" ON "MaintenanceScheduleRun"("status");

-- CreateIndex
CREATE INDEX "MaintenanceScheduleRun_workOrderId_idx" ON "MaintenanceScheduleRun"("workOrderId");

-- AddForeignKey
ALTER TABLE "MaintenanceScheduleRun" ADD CONSTRAINT "MaintenanceScheduleRun_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "maintenance_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceScheduleRun" ADD CONSTRAINT "MaintenanceScheduleRun_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceScheduleRun" ADD CONSTRAINT "MaintenanceScheduleRun_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
