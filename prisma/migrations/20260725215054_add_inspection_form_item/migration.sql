/*
  Warnings:

  - You are about to drop the column `itemId` on the `inspection_results` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[inspectionId,inspectionFormItemId]` on the table `inspection_results` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inspectionFormItemId` to the `inspection_results` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "inspection_results" DROP CONSTRAINT "inspection_results_itemId_fkey";

-- DropIndex
DROP INDEX "inspection_results_inspectionId_itemId_key";

-- DropIndex
DROP INDEX "inspection_results_itemId_idx";

-- AlterTable
ALTER TABLE "inspection_results" DROP COLUMN "itemId",
ADD COLUMN     "inspectionFormItemId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "inspection_form_items" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "itemId" TEXT,
    "categoryName" TEXT NOT NULL,
    "categoryNameAr" TEXT,
    "itemCode" TEXT,
    "itemName" TEXT NOT NULL,
    "itemNameAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "riskLevel" TEXT,
    "inputType" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "autoCreateWorkOrder" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "inspection_form_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspection_form_items_inspectionId_idx" ON "inspection_form_items"("inspectionId");

-- CreateIndex
CREATE INDEX "inspection_form_items_categoryId_idx" ON "inspection_form_items"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_form_items_inspectionId_itemId_key" ON "inspection_form_items"("inspectionId", "itemId");

-- CreateIndex
CREATE INDEX "inspection_results_inspectionFormItemId_idx" ON "inspection_results"("inspectionFormItemId");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_results_inspectionId_inspectionFormItemId_key" ON "inspection_results"("inspectionId", "inspectionFormItemId");

-- AddForeignKey
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_inspectionFormItemId_fkey" FOREIGN KEY ("inspectionFormItemId") REFERENCES "inspection_form_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_form_items" ADD CONSTRAINT "inspection_form_items_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
