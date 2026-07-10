// src/app/[locale]/(dashboard)/assets/[id]/types.ts

// ============================================================
//  الأنواع الأساسية (Base Types)
// ============================================================

/**
 * كيان مترجم (يدعم اللغة العربية والإنجليزية)
 */
export interface LocalizedEntity {
  id: string;
  name: string;
  nameEn?: string;
}

/**
 * كيان مترجم مع كود
 */
export interface CodeEntity extends LocalizedEntity {
  code?: string;
}

/**
 * حالة (Status) مع لون
 */
export interface Status extends LocalizedEntity {
  color?: string;
}

// ============================================================
//  الموقع (Location)
// ============================================================

export interface Branch extends CodeEntity {}

export interface Building extends CodeEntity {
  branch?: Branch;
}

export interface Floor extends CodeEntity {
  building?: Building;
}

export interface Room extends CodeEntity {
  floor?: Floor;
}

// ============================================================
//  الأصل (Asset)
// ============================================================

export interface AssetDetail {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  type?: LocalizedEntity;
  status?: Status;
  purchaseDate?: string;
  operationDate?: string;
  warrantyEnd?: string;
  lastMaintenanceDate?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  supplier?: string;
  notes?: string;
  room?: Room;
}

// ============================================================
//  أوامر العمل (Work Orders)
// ============================================================

export interface WorkOrder {
  id: string;
  title: string;
  createdAt: string;
  status: Status; // ✅ نفس النمط المستخدم في Asset
  priority: LocalizedEntity;
}

// ============================================================
//  سجل الصيانة (Maintenance History)
// ============================================================

export interface MaintenanceRecord {
  id: string;
  scheduleName: string;
  executedAt: string;
  workOrderCode?: string; // ✅ اختياري
  notes?: string;
}