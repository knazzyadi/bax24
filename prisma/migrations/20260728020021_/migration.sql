-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('Open', 'InProgress', 'Resolved', 'Verified', 'Closed', 'Cancelled');

-- CreateTable
CREATE TABLE "InspectionFinding" (
    "id" TEXT NOT NULL,
    "inspectionResultId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "riskLevel" "RiskLevel" NOT NULL,
    "correctiveAction" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "FindingStatus" NOT NULL DEFAULT 'Open',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderFinding" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,

    CONSTRAINT "WorkOrderFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionFindingImage" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionFindingImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderFinding_workOrderId_findingId_key" ON "WorkOrderFinding"("workOrderId", "findingId");

-- AddForeignKey
ALTER TABLE "InspectionFinding" ADD CONSTRAINT "InspectionFinding_inspectionResultId_fkey" FOREIGN KEY ("inspectionResultId") REFERENCES "inspection_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionFinding" ADD CONSTRAINT "InspectionFinding_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderFinding" ADD CONSTRAINT "WorkOrderFinding_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderFinding" ADD CONSTRAINT "WorkOrderFinding_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "InspectionFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionFindingImage" ADD CONSTRAINT "InspectionFindingImage_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "InspectionFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
