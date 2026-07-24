-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('draft', 'in_progress', 'completed', 'approved', 'cancelled');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('pass', 'fail', 'na');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "InputType" AS ENUM ('pass_fail', 'numeric', 'text');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "inspection_categories" (
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

    CONSTRAINT "inspection_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_items" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "nameAr" VARCHAR(255),
    "description" TEXT,
    "cbahiCode" VARCHAR(100),
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'medium',
    "inputType" "InputType" NOT NULL DEFAULT 'pass_fail',
    "autoCreateWorkOrder" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "inspection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "code" TEXT,
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "branchId" TEXT,
    "buildingId" TEXT,
    "floorId" TEXT,
    "roomId" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "inspectorId" TEXT,
    "approvedById" TEXT,
    "status" "InspectionStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_category_selections" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inspection_category_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_results" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "result" "ResultStatus" NOT NULL DEFAULT 'na',
    "notes" TEXT,
    "score" DECIMAL(10,2),
    "maxScore" DECIMAL(10,2),
    "minScore" DECIMAL(65,30),
    "executedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "executedById" TEXT,
    "workOrderId" TEXT,

    CONSTRAINT "inspection_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_result_images" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "comment" TEXT,

    CONSTRAINT "inspection_result_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_activities" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_backups" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "status" "BackupStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_backups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspection_categories_companyId_idx" ON "inspection_categories"("companyId");

-- CreateIndex
CREATE INDEX "inspection_categories_isActive_idx" ON "inspection_categories"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_categories_companyId_name_key" ON "inspection_categories"("companyId", "name");

-- CreateIndex
CREATE INDEX "inspection_items_companyId_idx" ON "inspection_items"("companyId");

-- CreateIndex
CREATE INDEX "inspection_items_categoryId_idx" ON "inspection_items"("categoryId");

-- CreateIndex
CREATE INDEX "inspection_items_isActive_idx" ON "inspection_items"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_items_companyId_name_key" ON "inspection_items"("companyId", "name");

-- CreateIndex
CREATE INDEX "inspections_companyId_idx" ON "inspections"("companyId");

-- CreateIndex
CREATE INDEX "inspections_status_idx" ON "inspections"("status");

-- CreateIndex
CREATE INDEX "inspections_scheduledDate_idx" ON "inspections"("scheduledDate");

-- CreateIndex
CREATE INDEX "inspections_branchId_idx" ON "inspections"("branchId");

-- CreateIndex
CREATE INDEX "inspections_buildingId_idx" ON "inspections"("buildingId");

-- CreateIndex
CREATE INDEX "inspections_floorId_idx" ON "inspections"("floorId");

-- CreateIndex
CREATE INDEX "inspections_roomId_idx" ON "inspections"("roomId");

-- CreateIndex
CREATE INDEX "inspection_category_selections_inspectionId_idx" ON "inspection_category_selections"("inspectionId");

-- CreateIndex
CREATE INDEX "inspection_category_selections_categoryId_idx" ON "inspection_category_selections"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_category_selections_inspectionId_categoryId_key" ON "inspection_category_selections"("inspectionId", "categoryId");

-- CreateIndex
CREATE INDEX "inspection_results_inspectionId_idx" ON "inspection_results"("inspectionId");

-- CreateIndex
CREATE INDEX "inspection_results_itemId_idx" ON "inspection_results"("itemId");

-- CreateIndex
CREATE INDEX "inspection_results_result_idx" ON "inspection_results"("result");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_results_inspectionId_itemId_key" ON "inspection_results"("inspectionId", "itemId");

-- CreateIndex
CREATE INDEX "inspection_result_images_resultId_idx" ON "inspection_result_images"("resultId");

-- CreateIndex
CREATE INDEX "inspection_activities_inspectionId_idx" ON "inspection_activities"("inspectionId");

-- CreateIndex
CREATE INDEX "inspection_activities_userId_idx" ON "inspection_activities"("userId");

-- CreateIndex
CREATE INDEX "company_backups_companyId_idx" ON "company_backups"("companyId");

-- CreateIndex
CREATE INDEX "company_backups_createdAt_idx" ON "company_backups"("createdAt");

-- AddForeignKey
ALTER TABLE "inspection_categories" ADD CONSTRAINT "inspection_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "inspection_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_category_selections" ADD CONSTRAINT "inspection_category_selections_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_category_selections" ADD CONSTRAINT "inspection_category_selections_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "inspection_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inspection_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_result_images" ADD CONSTRAINT "inspection_result_images_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "inspection_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_activities" ADD CONSTRAINT "inspection_activities_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_activities" ADD CONSTRAINT "inspection_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_backups" ADD CONSTRAINT "company_backups_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_backups" ADD CONSTRAINT "company_backups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
