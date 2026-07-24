// src/types/inspection-section.ts
import type { InspectionTemplate } from './inspection-template';

export interface InspectionSection {
  id: string;
  companyId: string;
  code: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  templates?: InspectionTemplate[];
  _count?: {
    templates: number;
  };
}