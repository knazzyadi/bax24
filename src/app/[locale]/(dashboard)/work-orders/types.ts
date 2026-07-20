// src/app/[locale]/(dashboard)/work-orders/types.ts

export type WorkOrderSource = "ticket" | "pm" | "checklist" | "manual";
export type WorkOrderCategory = "ELECTRICAL" | "MECHANICAL" | "HVAC" | "MEDICAL" | "FIRE" | "IT" | "CIVIL" | "OTHER";
export type LocationLevel = "building" | "floor" | "room";

export interface WorkOrderFormData {
  id?: string;
  title: string;
  description?: string | null;
  // ✅ استخدم workOrderTypeId بدلاً من type (للتمييز عن enum)
  workOrderTypeId: string; // معرف نوع أمر العمل من جدول الإعدادات
  // ❌ تم إزالة `type: string` القديم
  source: WorkOrderSource;
  priorityId?: string | null;
  statusId?: string | null;
  assetTypeId?: string | null;
  category?: WorkOrderCategory | null;
  reason?: string | null;
  notes?: string | null;
  branchId: string;
  buildingId?: string | null;
  floorId?: string | null;
  roomId?: string | null;
  assetIds?: string[];
  assignedTo?: string[];
  sourceId?: string | null;
  locationLevel?: LocationLevel;
}

export interface Priority {
  id: string;
  name: string;
  nameEn?: string | null;
  color?: string | null;
}

export interface Status {
  id: string;
  name: string;
  nameEn?: string | null;
  color?: string | null;
}

export interface AssetType {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
}

export interface Building {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
}

export interface Floor {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  buildingId: string;
}

export interface Room {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  floorId: string;
  buildingId?: string;
  fullCode?: string;
}

// ============================================================
// الأنواع الأساسية (للمنطق الداخلي فقط)
// ============================================================

export type WorkOrderType = "MAINTENANCE" | "CORRECTIVE" | "EMERGENCY" | "BULK_PREVENTIVE";
export type PriorityCode = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
export type StatusCode = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "ON_HOLD";

export interface WorkOrder {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: WorkOrderType; // هذا هو enum الموجود في قاعدة البيانات
  priority: {
    id: string;
    code?: PriorityCode;
    name: string;
    nameEn?: string;
    color?: string;
  } | null;
  status: {
    id: string;
    code?: StatusCode;
    name: string;
    nameEn?: string;
    color?: string;
  } | null;
  branch: {
    id: string;
    name: string;
    nameEn?: string;
  } | null;
  room: {
    id: string;
    name: string;
    nameEn?: string;
    floor?: {
      name: string;
      nameEn?: string;
      building?: {
        name: string;
        nameEn?: string;
      };
    };
  } | null;
  assetType?: {
    id: string;
    name: string;
    nameEn?: string;
  } | null;
  asset: {
    id: string;
    name: string;
    code: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}