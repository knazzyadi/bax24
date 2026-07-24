// src/types/inspection-item.ts
import type { InspectionCategory } from './inspection-category';

export interface InspectionItem {
  id: string;
  categoryId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  cbahiCode?: string | null;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  inputType: 'pass_fail' | 'numeric' | 'text';
  autoCreateWorkOrder: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  category?: InspectionCategory;
}