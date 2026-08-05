// src/lib/backup/types.ts
import type {
  Company,
  Branch,
  Building,
  Floor,
  Room,
  Asset,
  AssetType,
  AssetStatus,
  WorkOrderType,
  WorkOrderStatus,
  WorkOrderPriority,
  WorkOrder,
  Prisma,
} from "@prisma/client";

// ============================================================
// تعريف BackupStatus محلياً كنوع نصي
// ============================================================
export type BackupStatus = "PENDING" | "COMPLETED" | "FAILED";

export type BackupType = "full" | "config";

export const VALID_BACKUP_TYPES: BackupType[] = ["full", "config"];

// ============================================================
// الأنواع الخاصة بالنسخ الاحتياطي
// ============================================================

export type InspectionWithItems = Prisma.InspectionCategoryGetPayload<{
  include: { items: true };
}>;

export interface BackupData {
  company: Company | null;
  branches: Branch[];
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  assets: Asset[];
  assetTypes: AssetType[];
  assetStatuses: AssetStatus[];
  workOrderTypes: WorkOrderType[];
  workOrderStatuses: WorkOrderStatus[];
  workOrderPriorities: WorkOrderPriority[];
  workOrders: WorkOrder[];
  inspections: InspectionWithItems[];
}

export interface BackupPayload {
  version: number;
  createdAt: string;
  companyId: string;
  type: BackupType;
  data: Partial<BackupData>;
}