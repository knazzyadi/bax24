// src/app/[locale]/(dashboard)/work-orders/types.ts

// ============================================================
// الأنواع الأساسية - متوافقة مع Prisma
// ============================================================

/**
 * مصادر إنشاء أمر العمل (مطابق لـ Prisma enum WorkOrderSource)
 */
export type WorkOrderSource = "manual" | "ticket" | "ppm" | "checklist" | "inspection_finding";

/**
 * أنواع أوامر العمل (مطابق لـ Prisma enum WorkOrderTypeEnum)
 */
export type WorkOrderTypeEnum = "MAINTENANCE" | "CORRECTIVE" | "EMERGENCY" | "BULK_PREVENTIVE";

/**
 * أكواد الأولويات - فقط للتوثيق (في Prisma هي field عادي)
 */
export type PriorityCode = string;

/**
 * أكواد الحالات - فقط للتوثيق (في Prisma هي field عادي)
 */
export type StatusCode = string;

// ============================================================
// تعريف الكيانات المرتبطة (مبسطة لتتناسب مع الـ select)
// ============================================================

export interface WorkOrderAttachment {
  id: string;
  url: string;
  fileName?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  createdAt: string;
}

// ============================================================
// النوع الرئيسي WorkOrder (معدّل)
// ============================================================

export interface WorkOrder {
  id: string;
  code: string; // ✅ أصبح non-nullable
  title: string;
  description: string | null;
  type: WorkOrderTypeEnum;
  priority: {
    id: string;
    code?: string; // ✅ بدون null
    name: string;
    nameEn?: string; // ✅ بدون null
    color?: string; // ✅ بدون null
  } | null;
  status: {
    id: string;
    code?: string; // ✅ بدون null
    name: string;
    nameEn?: string; // ✅ بدون null
    color?: string; // ✅ بدون null
  } | null;
  branch: {
    id: string;
    name: string;
    nameEn?: string | null;
  } | null;
  building: {
    id: string;
    name: string;
    nameEn?: string | null;
  } | null;
  floor: {
    id: string;
    name: string;
    nameEn?: string | null;
  } | null;
  room: {
    id: string;
    name: string;
    nameEn?: string | null;
  } | null;
  locationString: string;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  workOrderAssets: {
    assetId: string;
    completedAt: string | null;
    notes: string | null;
    asset: {
      id: string;
      name: string;
      nameEn?: string | null;
      code: string;
    };
  }[];
  assetCount: number;
  assetType: {
    id: string;
    name: string;
    nameEn?: string | null;
  } | null;
  workOrderType: {
    id: string;
    name: string;
    nameEn?: string | null;
  } | null;
  ticket: {
    id: string;
    title: string;
    description: string | null;
    code: string;
  } | null;
  attachments: WorkOrderAttachment[];
  source: WorkOrderSource;
  sourceId?: string | null; // ✅ أصبح اختيارياً
  sourceType?: string | null;
  reason: string | null;
  createdBy: { id: string; name: string; email: string } | null;
  assignedTo: { id: string; name: string; email: string } | null;
}

// ============================================================
// نموذج إنشاء/تحديث أمر العمل
// ============================================================

export interface WorkOrderFormData {
  title: string;
  description?: string | null;
  type?: WorkOrderTypeEnum;
  priorityId?: string | null;
  statusId?: string | null;
  branchId?: string | null;
  buildingId?: string | null;
  floorId?: string | null;
  roomId?: string | null;
  assetTypeId?: string | null;
  workOrderTypeId?: string | null;
  assignedTo?: string | null;
  notes?: string | null;
  assetIds?: string[];
  scheduledDate?: string | null;
  dueDate?: string | null;
  source?: WorkOrderSource;
  sourceId?: string | null;
  sourceType?: string | null;
  category?: string | null;
  reason?: string | null;
}

// ============================================================
// تفاصيل أمر العمل - نوع بدلاً من واجهة فارغة
// ============================================================

export type WorkOrderDetailData = WorkOrder; // ✅ استبدال interface ب type

// ============================================================
// أنواع الكيانات المرتبطة (حالة، أولوية) - معدلة
// ============================================================

export interface WorkOrderStatus {
  id: string;
  code?: string; // ✅ بدون null
  name: string;
  nameEn?: string; // ✅ بدون null
  color?: string; // ✅ بدون null
  isDefault?: boolean;
  isFinal?: boolean;
}

export interface WorkOrderPriority {
  id: string;
  code?: string; // ✅ بدون null
  name: string;
  nameEn?: string; // ✅ بدون null
  color?: string; // ✅ بدون null
  isDefault?: boolean;
  score?: number;
}

// ============================================================
// الفلاتر والإحصائيات
// ============================================================

export interface WorkOrderFilter {
  status?: string | string[];
  priority?: string | string[];
  type?: WorkOrderTypeEnum | WorkOrderTypeEnum[];
  source?: WorkOrderSource | WorkOrderSource[];
  branchId?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  assignedTo?: string;
  createdBy?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface WorkOrderStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  onHold: number;
  overdue: number;
  dueToday: number;
}

// ============================================================
// تصدير الكل
// ============================================================

export type WorkOrderTypes = {
  WorkOrder: WorkOrder;
  WorkOrderFormData: WorkOrderFormData;
  WorkOrderDetailData: WorkOrderDetailData;
  WorkOrderTypeEnum: WorkOrderTypeEnum;
  WorkOrderSource: WorkOrderSource;
  WorkOrderStatus: WorkOrderStatus;
  WorkOrderPriority: WorkOrderPriority;
  WorkOrderFilter: WorkOrderFilter;
  WorkOrderStats: WorkOrderStats;
  WorkOrderAttachment: WorkOrderAttachment;
};