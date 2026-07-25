// src/app/[locale]/(dashboard)/settings/inspection-types/types.ts

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
export interface TreeNode {
  id: string;
  name: string;
  type: "section" | "template" | "category" | "item";
  children: TreeNode[];
  original: InspectionSection | InspectionTemplate | InspectionCategory | InspectionItem;
  hasLoaded?: boolean; // ✅ جديد: هل تم تحميل الأبناء؟
  isLoading?: boolean; // ✅ جديد: هل يجري تحميل الأبناء؟
}
