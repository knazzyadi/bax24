/*
  Warnings:

  - You are about to drop the `MaintenanceSchedule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MaintenanceSchedule" DROP CONSTRAINT "MaintenanceSchedule_assetTypeId_fkey";

-- DropForeignKey
ALTER TABLE "MaintenanceSchedule" DROP CONSTRAINT "MaintenanceSchedule_branchId_fkey";

-- DropForeignKey
ALTER TABLE "MaintenanceSchedule" DROP CONSTRAINT "MaintenanceSchedule_buildingId_fkey";

-- DropForeignKey
ALTER TABLE "MaintenanceSchedule" DROP CONSTRAINT "MaintenanceSchedule_companyId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleAsset" DROP CONSTRAINT "ScheduleAsset_scheduleId_fkey";

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "maintenanceScheduleId" TEXT;

-- DropTable
DROP TABLE "MaintenanceSchedule";

-- CreateTable
CREATE TABLE "maintenance_schedules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "frequencyDays" INTEGER DEFAULT 30,
    "leadDays" INTEGER NOT NULL DEFAULT 30,
    "startDate" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "buildingId" TEXT,
    "floorId" TEXT,
    "roomId" TEXT,
    "locationLevel" TEXT,
    "assetTypeId" TEXT,

    CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_schedules_companyId_idx" ON "maintenance_schedules"("companyId");

-- CreateIndex
CREATE INDEX "maintenance_schedules_branchId_idx" ON "maintenance_schedules"("branchId");

-- CreateIndex
CREATE INDEX "maintenance_schedules_buildingId_idx" ON "maintenance_schedules"("buildingId");

-- CreateIndex
CREATE INDEX "maintenance_schedules_floorId_idx" ON "maintenance_schedules"("floorId");

-- CreateIndex
CREATE INDEX "maintenance_schedules_roomId_idx" ON "maintenance_schedules"("roomId");

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_maintenanceScheduleId_fkey" FOREIGN KEY ("maintenanceScheduleId") REFERENCES "maintenance_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "asset_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleAsset" ADD CONSTRAINT "ScheduleAsset_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "maintenance_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
