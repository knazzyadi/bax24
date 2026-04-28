// src/types/assets.ts الحل الجذري: نقل جميع الواجهات المشتركة إلى ملف واحد
/** بدلاً من تكرار تعريفات AssetStatus و AssetType و Building و Floor و Room 
 * في كل ملف، سننشئ ملفًا مركزيًا للأنواع (types) ونستورده في كل مكان
*/
export interface AssetStatus {
  id: string;
  name: string;
  nameEn?: string;
  color?: string | null;
  order?: number;
  isDefault?: boolean;
}

export interface AssetType {
  id: string;
  name: string;
  nameEn?: string;
  description?: string | null;
  order?: number;
  isDefault?: boolean;
}

export interface Building {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string;
}

export interface Floor {
  id: string;
  name: string;
  nameEn?: string | null;
  buildingId: string;
  code?: string;
}

export interface Room {
  id: string;
  name: string;
  nameEn?: string | null;
  floorId: string;
  buildingId?: string;
  code?: string;
  fullCode?: string;  // فقط للعرض
}

// نوع الأصل الكامل (Asset) إذا احتجته في عدة صفحات
export interface Asset {
  id: string;
  name: string;
  nameEn?: string | null;
  code: string;
  type?: AssetType | null;
  status?: AssetStatus | null;
  room?: (Room & { floor?: Floor & { building?: Building } }) | null;
  purchaseDate?: string | null;
  warrantyEnd?: string | null;
  notes?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}