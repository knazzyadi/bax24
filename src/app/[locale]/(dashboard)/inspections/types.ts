// src/app/[locale]/(dashboard)/inspections/types.ts

// ============================================================
// الأنواع الأساسية للفحوصات
// ============================================================

export interface Inspection {
  id: string;
  title: string;
  
  // بيانات الفرع (مطلوبة)
  branchId: string;
  branch: {
    id: string;
    name: string;
    nameEn?: string | null; // ✅ null للتوافق مع Prisma
  };
  
  locationName?: string;
  scheduledDate: string;
  inspectorName?: string;
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
  inspectionFormItemId: string;
  result: 'pass' | 'fail' | 'na';
  notes?: string;
  imageUrl?: string;
  workOrderId?: string;
  executedAt?: string;
  updatedAt: string;
  findings?: Finding[];
}

export interface FindingDraft {
  title: string;
  description?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  correctiveAction?: string;
  dueDate?: string;
}

export interface ResultState {
  id: string;
  inspectionFormItemId: string;
  result: 'pass' | 'fail' | 'na';
  notes?: string;
  imageUrl?: string;
  findingId?: string;
  workOrderId?: string;
  finding?: FindingDraft | null;
  findings?: Finding[];
}

export interface InspectionData {
  id: string;
  title: string;

  branchId: string;
  branch: {
    id: string;
    name: string;
    nameEn?: string; // ✅ اختياري بدون null
  };

  locationName?: string;
  scheduledDate: string;
  status: string;
  categories: InspectionCategoryWithItems[];
  createdAt: string;
  updatedAt: string;

  // ✅ الحقول الإضافية للتوافق مع بيانات Prisma (اختيارية)
  buildingId?: string | null;
  floorId?: string | null;
  roomId?: string | null;
}

export interface InspectionCategoryWithItems {
  categoryId: string;
  categoryName: string;
  categoryNameAr?: string;
  items: InspectionItemWithResult[];
}

export interface InspectionItemWithResult {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  descriptionAr?: string;
  code?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  inputType?: 'pass_fail' | 'numeric' | 'text';
  sortOrder?: number;
  result?: ResultState | null;
}

export interface Finding {
  id: string;
  title: string;
  description: string | null;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'Open' | 'InProgress' | 'Resolved' | 'Verified' | 'Closed' | 'Cancelled';
  correctiveAction: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  inspectionResultId: string;
  createdById?: string | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  workOrders: Array<{
    workOrder: {
      id: string;
      code: string;
      title: string;
      status: {
        id: string;
        name: string;
        nameEn: string;
        color: string;
      };
    };
  }>;
}

export interface WorkOrder {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: string;
  status: {
    id: string;
    name: string;
    nameEn: string;
    color: string;
  };
  priority?: {
    id: string;
    name: string;
    nameEn: string;
    color: string;
  };
  branchId?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  locationLevel?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  source: 'MANUAL' | 'INSPECTION' | 'INSPECTION_FINDING' | 'PREVENTIVE_MAINTENANCE';
  sourceId?: string;
}

export interface FilterOption {
  id: string;
  name: string;
  nameEn: string;
}

export interface PaginationInfo {
  hasMore: boolean;
  nextUrl: string | null;
  prevUrl: string | null;
  currentCount: number;
  totalCount: number;
  startIndex: number;
  currentPage: number;
  totalPages: number;
}

export interface InspectionStats {
  total: number;
  pass: number;
  fail: number;
  na: number;
  completionRate: number;
  findingsCount: number;
}