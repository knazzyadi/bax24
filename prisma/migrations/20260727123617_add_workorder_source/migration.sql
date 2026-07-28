/*
  Warnings:

  - You are about to drop the column `source` on the `work_order_types` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "work_order_types" DROP COLUMN "source";

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "source" "WorkOrderSource" NOT NULL DEFAULT 'manual';
