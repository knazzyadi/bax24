/*
  Warnings:

  - You are about to drop the `Supplier` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[companyId,code]` on the table `inspection_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `templateId` to the `inspection_categories` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_companyId_fkey";

-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_supplierId_fkey";

-- DropIndex
DROP INDEX "assets_code_key";

-- DropIndex
DROP INDEX "inspection_categories_companyId_name_key";

-- DropIndex
DROP INDEX "inspection_items_categoryId_code_key";

-- DropIndex
DROP INDEX "inspection_items_companyId_name_key";

-- AlterTable
ALTER TABLE "inspection_categories" ADD COLUMN     "templateId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Supplier";

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "code" TEXT,
    "description" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "taxNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_sections" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "nameAr" VARCHAR(255),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "inspection_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "nameAr" VARCHAR(255),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "inspection_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE INDEX "suppliers_companyId_idx" ON "suppliers"("companyId");

-- CreateIndex
CREATE INDEX "suppliers_isActive_idx" ON "suppliers"("isActive");

-- CreateIndex
CREATE INDEX "suppliers_deletedAt_idx" ON "suppliers"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_companyId_code_key" ON "suppliers"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_companyId_name_key" ON "suppliers"("companyId", "name");

-- CreateIndex
CREATE INDEX "inspection_sections_companyId_idx" ON "inspection_sections"("companyId");

-- CreateIndex
CREATE INDEX "inspection_sections_isActive_idx" ON "inspection_sections"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_sections_companyId_code_key" ON "inspection_sections"("companyId", "code");

-- CreateIndex
CREATE INDEX "inspection_templates_companyId_idx" ON "inspection_templates"("companyId");

-- CreateIndex
CREATE INDEX "inspection_templates_sectionId_idx" ON "inspection_templates"("sectionId");

-- CreateIndex
CREATE INDEX "inspection_templates_isActive_idx" ON "inspection_templates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_templates_companyId_code_key" ON "inspection_templates"("companyId", "code");

-- CreateIndex
CREATE INDEX "inspection_categories_templateId_idx" ON "inspection_categories"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_items_companyId_code_key" ON "inspection_items"("companyId", "code");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_sections" ADD CONSTRAINT "inspection_sections_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_templates" ADD CONSTRAINT "inspection_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_templates" ADD CONSTRAINT "inspection_templates_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "inspection_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_categories" ADD CONSTRAINT "inspection_categories_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "inspection_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
