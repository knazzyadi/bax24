/*
  Warnings:

  - Made the column `branchId` on table `inspections` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "inspections" DROP CONSTRAINT "inspections_branchId_fkey";

-- AlterTable
ALTER TABLE "inspections" ALTER COLUMN "branchId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
