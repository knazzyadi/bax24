/*
  Warnings:

  - You are about to alter the column `name` on the `asset_statuses` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `nameEn` on the `asset_statuses` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `code` on the `asset_statuses` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `color` on the `asset_statuses` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `name` on the `asset_types` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `nameEn` on the `asset_types` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `code` on the `asset_types` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to drop the `Contract` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InventoryItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ticket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkOrder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkOrderPriority` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkOrderStatus` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[companyId,name]` on the table `asset_statuses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,code]` on the table `asset_statuses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,name]` on the table `asset_types` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,code]` on the table `asset_types` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WorkOrderTypeEnum" AS ENUM ('MAINTENANCE', 'CORRECTIVE', 'EMERGENCY', 'BULK_PREVENTIVE');

-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_branchId_fkey";

-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_companyId_fkey";

-- DropForeignKey
ALTER TABLE "ContractAttachment" DROP CONSTRAINT "ContractAttachment_contractId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_companyId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_roomId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_assetId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_branchId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_roomId_fkey";

-- DropForeignKey
ALTER TABLE "TicketAttachment" DROP CONSTRAINT "TicketAttachment_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrder" DROP CONSTRAINT "WorkOrder_assetTypeId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrder" DROP CONSTRAINT "WorkOrder_branchId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrder" DROP CONSTRAINT "WorkOrder_companyId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrder" DROP CONSTRAINT "WorkOrder_priorityId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrder" DROP CONSTRAINT "WorkOrder_roomId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrder" DROP CONSTRAINT "WorkOrder_statusId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrder" DROP CONSTRAINT "WorkOrder_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrderAsset" DROP CONSTRAINT "WorkOrderAsset_workOrderId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrderAttachment" DROP CONSTRAINT "WorkOrderAttachment_workOrderId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrderPriority" DROP CONSTRAINT "WorkOrderPriority_companyId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrderStatus" DROP CONSTRAINT "WorkOrderStatus_companyId_fkey";

-- DropForeignKey
ALTER TABLE "work_order_inventory" DROP CONSTRAINT "work_order_inventory_inventoryItemId_fkey";

-- DropForeignKey
ALTER TABLE "work_order_inventory" DROP CONSTRAINT "work_order_inventory_workOrderId_fkey";

-- DropIndex
DROP INDEX "asset_statuses_code_key";

-- DropIndex
DROP INDEX "asset_statuses_name_companyId_key";

-- DropIndex
DROP INDEX "asset_types_code_key";

-- DropIndex
DROP INDEX "asset_types_name_companyId_key";

-- AlterTable
ALTER TABLE "asset_statuses" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "icon" VARCHAR(50),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "nameEn" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "code" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "color" DROP DEFAULT,
ALTER COLUMN "color" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "asset_types" ADD COLUMN     "color" VARCHAR(20),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "icon" VARCHAR(50),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "nameEn" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "code" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "description" TEXT,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "operationDate" TIMESTAMP(3),
ADD COLUMN     "serialNumber" TEXT,
ADD COLUMN     "supplier" TEXT;

-- DropTable
DROP TABLE "Contract";

-- DropTable
DROP TABLE "InventoryItem";

-- DropTable
DROP TABLE "Ticket";

-- DropTable
DROP TABLE "WorkOrder";

-- DropTable
DROP TABLE "WorkOrderPriority";

-- DropTable
DROP TABLE "WorkOrderStatus";

-- DropEnum
DROP TYPE "WorkOrderType";

-- CreateTable
CREATE TABLE "work_order_types" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20),
    "name" VARCHAR(100) NOT NULL,
    "nameEn" VARCHAR(100),
    "description" TEXT,
    "color" VARCHAR(20),
    "icon" VARCHAR(50),
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "work_order_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_statuses" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20),
    "name" VARCHAR(100) NOT NULL,
    "nameEn" VARCHAR(100),
    "description" TEXT,
    "color" VARCHAR(20),
    "icon" VARCHAR(50),
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "work_order_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_priorities" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20),
    "name" VARCHAR(100) NOT NULL,
    "nameEn" VARCHAR(100),
    "description" TEXT,
    "color" VARCHAR(20),
    "icon" VARCHAR(50),
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "work_order_priorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_close_reasons" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20),
    "name" VARCHAR(100) NOT NULL,
    "nameEn" VARCHAR(100),
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "work_order_close_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_cancel_reasons" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20),
    "name" VARCHAR(100) NOT NULL,
    "nameEn" VARCHAR(100),
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "work_order_cancel_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_location_history" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "old_room_id" TEXT,
    "new_room_id" TEXT NOT NULL,
    "old_building_id" TEXT,
    "new_building_id" TEXT NOT NULL,
    "old_branch_id" TEXT,
    "new_branch_id" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "asset_location_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT DEFAULT 'قطعة',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "roomId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "cancellationReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdBy" TEXT,
    "agentName" TEXT,
    "agentPhone" TEXT,
    "agentEmail" TEXT,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "branchSeqNum" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "WorkOrderTypeEnum" NOT NULL DEFAULT 'MAINTENANCE',
    "priorityId" TEXT,
    "statusId" TEXT,
    "roomId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdBy" TEXT,
    "assetTypeId" TEXT,
    "workOrderTypeId" TEXT,
    "ticketId" TEXT,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "branchSeqNum" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assetId" TEXT,
    "roomId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdBy" TEXT,
    "type" "TicketType" NOT NULL DEFAULT 'MAINTENANCE',
    "phone" TEXT,
    "reporterEmail" TEXT NOT NULL,
    "reporterName" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_order_types_companyId_idx" ON "work_order_types"("companyId");

-- CreateIndex
CREATE INDEX "work_order_types_order_idx" ON "work_order_types"("order");

-- CreateIndex
CREATE INDEX "work_order_types_isActive_idx" ON "work_order_types"("isActive");

-- CreateIndex
CREATE INDEX "work_order_types_deletedAt_idx" ON "work_order_types"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_types_companyId_name_key" ON "work_order_types"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_types_companyId_code_key" ON "work_order_types"("companyId", "code");

-- CreateIndex
CREATE INDEX "work_order_statuses_companyId_idx" ON "work_order_statuses"("companyId");

-- CreateIndex
CREATE INDEX "work_order_statuses_order_idx" ON "work_order_statuses"("order");

-- CreateIndex
CREATE INDEX "work_order_statuses_isActive_idx" ON "work_order_statuses"("isActive");

-- CreateIndex
CREATE INDEX "work_order_statuses_deletedAt_idx" ON "work_order_statuses"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_statuses_companyId_name_key" ON "work_order_statuses"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_statuses_companyId_code_key" ON "work_order_statuses"("companyId", "code");

-- CreateIndex
CREATE INDEX "work_order_priorities_companyId_idx" ON "work_order_priorities"("companyId");

-- CreateIndex
CREATE INDEX "work_order_priorities_order_idx" ON "work_order_priorities"("order");

-- CreateIndex
CREATE INDEX "work_order_priorities_isActive_idx" ON "work_order_priorities"("isActive");

-- CreateIndex
CREATE INDEX "work_order_priorities_deletedAt_idx" ON "work_order_priorities"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_priorities_companyId_name_key" ON "work_order_priorities"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_priorities_companyId_code_key" ON "work_order_priorities"("companyId", "code");

-- CreateIndex
CREATE INDEX "work_order_close_reasons_companyId_idx" ON "work_order_close_reasons"("companyId");

-- CreateIndex
CREATE INDEX "work_order_close_reasons_order_idx" ON "work_order_close_reasons"("order");

-- CreateIndex
CREATE INDEX "work_order_close_reasons_isActive_idx" ON "work_order_close_reasons"("isActive");

-- CreateIndex
CREATE INDEX "work_order_close_reasons_deletedAt_idx" ON "work_order_close_reasons"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_close_reasons_companyId_name_key" ON "work_order_close_reasons"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_close_reasons_companyId_code_key" ON "work_order_close_reasons"("companyId", "code");

-- CreateIndex
CREATE INDEX "work_order_cancel_reasons_companyId_idx" ON "work_order_cancel_reasons"("companyId");

-- CreateIndex
CREATE INDEX "work_order_cancel_reasons_order_idx" ON "work_order_cancel_reasons"("order");

-- CreateIndex
CREATE INDEX "work_order_cancel_reasons_isActive_idx" ON "work_order_cancel_reasons"("isActive");

-- CreateIndex
CREATE INDEX "work_order_cancel_reasons_deletedAt_idx" ON "work_order_cancel_reasons"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_cancel_reasons_companyId_name_key" ON "work_order_cancel_reasons"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_cancel_reasons_companyId_code_key" ON "work_order_cancel_reasons"("companyId", "code");

-- CreateIndex
CREATE INDEX "asset_location_history_asset_id_idx" ON "asset_location_history"("asset_id");

-- CreateIndex
CREATE INDEX "asset_location_history_changed_at_idx" ON "asset_location_history"("changed_at");

-- CreateIndex
CREATE INDEX "audit_logs_asset_id_idx" ON "audit_logs"("asset_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");

-- CreateIndex
CREATE INDEX "inventory_items_companyId_idx" ON "inventory_items"("companyId");

-- CreateIndex
CREATE INDEX "inventory_items_roomId_idx" ON "inventory_items"("roomId");

-- CreateIndex
CREATE INDEX "inventory_items_sku_idx" ON "inventory_items"("sku");

-- CreateIndex
CREATE INDEX "inventory_items_companyId_deletedAt_idx" ON "inventory_items"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "inventory_items_createdAt_idx" ON "inventory_items"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_code_key" ON "contracts"("code");

-- CreateIndex
CREATE INDEX "contracts_companyId_idx" ON "contracts"("companyId");

-- CreateIndex
CREATE INDEX "contracts_branchId_idx" ON "contracts"("branchId");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contracts_startDate_idx" ON "contracts"("startDate");

-- CreateIndex
CREATE INDEX "contracts_endDate_idx" ON "contracts"("endDate");

-- CreateIndex
CREATE INDEX "contracts_companyId_deletedAt_idx" ON "contracts"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "contracts_createdAt_idx" ON "contracts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_code_key" ON "work_orders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_ticketId_key" ON "work_orders"("ticketId");

-- CreateIndex
CREATE INDEX "work_orders_companyId_deletedAt_idx" ON "work_orders"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "work_orders_companyId_idx" ON "work_orders"("companyId");

-- CreateIndex
CREATE INDEX "work_orders_branchId_idx" ON "work_orders"("branchId");

-- CreateIndex
CREATE INDEX "work_orders_roomId_idx" ON "work_orders"("roomId");

-- CreateIndex
CREATE INDEX "work_orders_statusId_idx" ON "work_orders"("statusId");

-- CreateIndex
CREATE INDEX "work_orders_priorityId_idx" ON "work_orders"("priorityId");

-- CreateIndex
CREATE INDEX "work_orders_workOrderTypeId_idx" ON "work_orders"("workOrderTypeId");

-- CreateIndex
CREATE INDEX "work_orders_createdAt_idx" ON "work_orders"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_branchId_branchSeqNum_key" ON "work_orders"("branchId", "branchSeqNum");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_code_key" ON "tickets"("code");

-- CreateIndex
CREATE INDEX "tickets_companyId_idx" ON "tickets"("companyId");

-- CreateIndex
CREATE INDEX "tickets_branchId_idx" ON "tickets"("branchId");

-- CreateIndex
CREATE INDEX "tickets_assetId_idx" ON "tickets"("assetId");

-- CreateIndex
CREATE INDEX "tickets_roomId_idx" ON "tickets"("roomId");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_branchSeqNum_idx" ON "tickets"("branchSeqNum");

-- CreateIndex
CREATE INDEX "tickets_companyId_deletedAt_idx" ON "tickets"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "tickets_createdAt_idx" ON "tickets"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_branchId_branchSeqNum_key" ON "tickets"("branchId", "branchSeqNum");

-- CreateIndex
CREATE INDEX "asset_statuses_companyId_idx" ON "asset_statuses"("companyId");

-- CreateIndex
CREATE INDEX "asset_statuses_order_idx" ON "asset_statuses"("order");

-- CreateIndex
CREATE INDEX "asset_statuses_isActive_idx" ON "asset_statuses"("isActive");

-- CreateIndex
CREATE INDEX "asset_statuses_deletedAt_idx" ON "asset_statuses"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "asset_statuses_companyId_name_key" ON "asset_statuses"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "asset_statuses_companyId_code_key" ON "asset_statuses"("companyId", "code");

-- CreateIndex
CREATE INDEX "asset_types_companyId_idx" ON "asset_types"("companyId");

-- CreateIndex
CREATE INDEX "asset_types_order_idx" ON "asset_types"("order");

-- CreateIndex
CREATE INDEX "asset_types_isActive_idx" ON "asset_types"("isActive");

-- CreateIndex
CREATE INDEX "asset_types_deletedAt_idx" ON "asset_types"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "asset_types_companyId_name_key" ON "asset_types"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "asset_types_companyId_code_key" ON "asset_types"("companyId", "code");

-- CreateIndex
CREATE INDEX "assets_companyId_deletedAt_idx" ON "assets"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "assets_createdAt_idx" ON "assets"("createdAt");

-- CreateIndex
CREATE INDEX "buildings_companyId_deletedAt_idx" ON "buildings"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "buildings_branchId_idx" ON "buildings"("branchId");

-- CreateIndex
CREATE INDEX "buildings_createdAt_idx" ON "buildings"("createdAt");

-- CreateIndex
CREATE INDEX "saved_reports_userId_companyId_updatedAt_idx" ON "saved_reports"("userId", "companyId", "updatedAt" DESC);

-- AddForeignKey
ALTER TABLE "work_order_types" ADD CONSTRAINT "work_order_types_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_statuses" ADD CONSTRAINT "work_order_statuses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_priorities" ADD CONSTRAINT "work_order_priorities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_close_reasons" ADD CONSTRAINT "work_order_close_reasons_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_cancel_reasons" ADD CONSTRAINT "work_order_cancel_reasons_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_location_history" ADD CONSTRAINT "asset_location_history_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_location_history" ADD CONSTRAINT "asset_location_history_old_room_id_fkey" FOREIGN KEY ("old_room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_location_history" ADD CONSTRAINT "asset_location_history_new_room_id_fkey" FOREIGN KEY ("new_room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_inventory" ADD CONSTRAINT "work_order_inventory_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_inventory" ADD CONSTRAINT "work_order_inventory_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAttachment" ADD CONSTRAINT "ContractAttachment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "asset_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "work_order_priorities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "work_order_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_workOrderTypeId_fkey" FOREIGN KEY ("workOrderTypeId") REFERENCES "work_order_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderAsset" ADD CONSTRAINT "WorkOrderAsset_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderAttachment" ADD CONSTRAINT "WorkOrderAttachment_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
