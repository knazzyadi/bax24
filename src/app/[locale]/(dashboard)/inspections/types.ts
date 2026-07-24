// src/app/[locale]/(dashboard)/inspections/types.ts
export interface Inspection {
  id: string;
  title: string;
  locationName?: string;
  scheduledDate: string;
  inspectorName?: string;
  // ✅ إضافة 'cancelled' لتتوافق مع Prisma enum
  status: 'draft' | 'in_progress' | 'completed' | 'approved' | 'cancelled';
  inspectorSignature?: string;
  supervisorSignature?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    totalItems: number;
    completedItems: number;
  };
}

export interface InspectionCategory {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  isActive: boolean;
  items?: InspectionItem[];
  _count?: {
    items: number;
  };
}

export interface InspectionItem {
  id: string;
  categoryId: string;
  name: string;
  nameAr?: string;
  cbahiCode?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  inputType: 'pass_fail' | 'numeric' | 'text';
  sortOrder: number;
  isActive: boolean;
}

export interface InspectionResult {
  id: string;
  inspectionId: string;
  itemId: string;
  result: 'pass' | 'fail' | 'na';
  notes?: string;
  imageUrl?: string;
  workOrderId?: string;
  executedAt?: string;
  updatedAt: string;
}