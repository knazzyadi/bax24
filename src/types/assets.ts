// src/types/assets.ts

// ============================================================
// الأنواع الأساسية (Base Types)
// ============================================================

export interface LocalizedEntity {
  id: string;
  name: string;
  nameEn?: string;
}

export interface CodeEntity extends LocalizedEntity {
  code?: string;
}

export interface Status extends LocalizedEntity {
  color?: string;
}

// ============================================================
// الموقع (Location)
// ============================================================

export interface Branch extends CodeEntity {
  companyId: string;
  company?: Company;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Building extends CodeEntity {
  code: string;
  order: number;
  branchId?: string | null;
  branch?: Branch;
  companyId: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Floor extends CodeEntity {
  code?: string;
  order: number;
  buildingId: string;
  building?: Building;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Room extends CodeEntity {
  code?: string;
  order: number;
  floorId: string;
  floor?: Floor;
  buildingId: string;
  fullCode?: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================
// الأصل (Asset) وأنواعه وحالاته
// ============================================================

export interface Asset {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  companyId: string;
  typeId?: string;
  type?: AssetTypeRef;
  statusId?: string;
  status?: AssetStatusRef;
  roomId?: string;
  room?: Room;
  buildingId?: string;
  branchId?: string;
  supplierId?: string;
  supplier?: Supplier;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  notes?: string;
  purchaseDate?: string | null;
  operationDate?: string | null;
  warrantyEnd?: string | null;
  lastMaintenanceDate?: string | null;
  qrCode?: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetTypeRef {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  description?: string;
  order?: number;
  isDefault?: boolean;
  isActive?: boolean;
  companyId: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ✅ AssetStatusRef مع description
export interface AssetStatusRef {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  color?: string;
  description?: string | null;
  order?: number;
  isDefault?: boolean;
  isActive?: boolean;
  companyId: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ✅ Supplier مع null
export interface Supplier {
  id: string;
  name: string;
  nameEn?: string;
  code?: string | null;          // ✅
  contactPerson?: string | null; // ✅
  phone?: string | null;         // ✅
  email?: string | null;         // ✅
  isActive?: boolean;
  companyId: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================
// الشركة (Company)
// ============================================================

export interface Company {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  taxNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  logo?: string;
  isActive?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================
// أدوات مساعدة (Utilities)
// ============================================================

export type WithTimestamps<T> = T & {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type WithCompany<T> = T & {
  companyId: string;
};

export type WithOrder<T> = T & {
  order: number;
};

// ============================================================
// واجهات الاستعلامات (Query Interfaces)
// ============================================================

export interface AssetsQueryParams {
  q?: string;
  typeId?: string;
  statusId?: string;
  roomId?: string;
  branchId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LocationQueryParams {
  branchId?: string;
  buildingId?: string;
  floorId?: string;
  search?: string;
  isActive?: boolean;
}

// ============================================================
// واجهات النماذج (Form Data)
// ============================================================

export interface BuildingFormData {
  name: string;
  nameEn?: string;
  code: string;
  order: number;
  branchId?: string;
}

export interface FloorFormData {
  name: string;
  nameEn?: string;
  code?: string;
  order: number;
  buildingId: string;
}

export interface RoomFormData {
  name: string;
  nameEn?: string;
  code?: string;
  order: number;
  floorId: string;
  buildingId: string;
}

export interface AssetFormData {
  name: string;
  nameEn?: string;
  description?: string;
  typeId?: string;
  statusId?: string;
  roomId: string;
  supplierId?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  notes?: string;
  purchaseDate?: string;
  operationDate?: string;
  warrantyEnd?: string;
  lastMaintenanceDate?: string;
}

// ============================================================
// إعادة التصدير بأسماء شائعة للاستخدام المباشر
// ============================================================

/**
 * هذان التصديران يمثلان الأسماء الرئيسية المستخدمة في التطبيق
 * تم تعيينهما كمرادفات للتعريفات الداخلية لتجنب تكرار الكود
 */
export type AssetStatus = AssetStatusRef;
export type AssetType = AssetTypeRef;

/**
 * تصديرات إضافية لأغراض التوثيق أو الاستخدام البديل
 * (يمكن الاستغناء عنها ولكنها مفيدة للتوضيح)
 */
export type { Branch as BranchType };
export type { Building as BuildingType };
export type { Floor as FloorType };
export type { Room as RoomType };
export type { Supplier as SupplierType };
export type { Company as CompanyType };