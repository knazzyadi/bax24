// src/types/inspection-category.ts
import type { InspectionTemplate } from './inspection-template';
import type { InspectionItem } from './inspection-item';

export interface InspectionCategory {
  id: string;
  companyId: string;
  templateId: string;
  code: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  template?: InspectionTemplate;
  items?: InspectionItem[];
  _count?: {
    items: number;
  };
}