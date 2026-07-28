-- CreateEnum
CREATE TYPE "LocationLevel" AS ENUM ('building', 'floor', 'room');

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "buildingId" TEXT,
ADD COLUMN     "floorId" TEXT,
ADD COLUMN     "locationLevel" "LocationLevel";

-- CreateIndex
CREATE INDEX "work_orders_buildingId_idx" ON "work_orders"("buildingId");

-- CreateIndex
CREATE INDEX "work_orders_floorId_idx" ON "work_orders"("floorId");

-- CreateIndex
CREATE INDEX "work_orders_assetTypeId_idx" ON "work_orders"("assetTypeId");

-- CreateIndex
CREATE INDEX "work_orders_maintenanceScheduleId_idx" ON "work_orders"("maintenanceScheduleId");

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
