// src/types/inspection-template.ts
import type { InspectionSection } from './inspection-section';
import type { InspectionCategory } from './inspection-category';

export interface InspectionTemplate {
  id: string;
  companyId: string;
  sectionId: string;
  code: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  section?: InspectionSection;
  categories?: InspectionCategory[];
  _count?: {
    categories: number;
  };
}