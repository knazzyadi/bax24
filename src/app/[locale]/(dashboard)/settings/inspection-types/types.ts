// src/app/[locale]/(dashboard)/settings/inspection-types/types.ts

export interface InspectionCategory {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  isActive: boolean;
  itemsCount?: number; // لعرض عدد البنود في الجدول
  createdAt?: string;
  updatedAt?: string;
}

export interface InspectionItem {
  id: string;
  categoryId: string;
  name: string;
  nameAr: string;
  cbahiCode?: string; // مثال: FMS.06
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  inputType: 'pass_fail' | 'numeric' | 'text';
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
}