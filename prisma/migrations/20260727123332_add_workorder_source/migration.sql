-- CreateEnum
CREATE TYPE "WorkOrderSource" AS ENUM ('manual', 'ticket', 'ppm', 'checklist');

-- AlterTable
ALTER TABLE "work_order_types" ADD COLUMN     "source" "WorkOrderSource" NOT NULL DEFAULT 'manual';
