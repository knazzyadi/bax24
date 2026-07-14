// src/types/work-orders.ts

// ============================================================
// أنواع أوامر العمل (Work Orders)
// ============================================================

/**
 * حالة أمر العمل
 */
export interface WorkOrderStatus {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  color?: string | null;
  order?: number;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * نوع أمر العمل
 */
export interface WorkOrderType {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  description?: string | null;
  order?: number;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * أولوية أمر العمل
 */
export interface WorkOrderPriority {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  color?: string | null;
  level?: number;        // مستوى الأولوية (1-10)
  order?: number;        // ✅ تمت إضافة order للتوافق مع باقي الأنواع
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * سبب إلغاء أمر العمل
 */
export interface WorkOrderCancelReason {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  description?: string | null;
  order?: number;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * سبب إغلاق أمر العمل
 */
export interface WorkOrderCloseReason {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  description?: string | null;
  order?: number;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * أمر العمل الكامل (للقراءة والعرض)
 */
export interface WorkOrder {
  id: string;
  title: string;
  description?: string | null;
  code?: string | null;
  statusId: string;
  status?: WorkOrderStatus;
  typeId?: string | null;
  type?: WorkOrderType;
  priorityId?: string | null;
  priority?: WorkOrderPriority;
  assetId?: string | null;
  assignedTo?: string | null;
  createdBy: string;
  scheduledDate?: string | null;
  completedDate?: string | null;
  cancelledDate?: string | null;
  cancelReasonId?: string | null;
  cancelReason?: WorkOrderCancelReason;
  closeReasonId?: string | null;
  closeReason?: WorkOrderCloseReason;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}