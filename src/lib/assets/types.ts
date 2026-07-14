// src/lib/assets/types.ts

import { z } from 'zod';

// ============================================================
// أنواع المدخلات
// ============================================================

export interface CreateAssetInput {
  name: string;
  nameEn?: string | null;
  description?: string | null;
  typeId: string;
  roomId: string;
  statusId?: string | null;
  supplierId?: string | null;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  notes?: string | null;
  purchaseDate?: string | null;
  operationDate?: string | null;
  warrantyEnd?: string | null;
  lastMaintenanceDate?: string | null;
}

export interface UpdateAssetInput extends Partial<CreateAssetInput> {
  id: string;
}

// ============================================================
// مخططات التحقق (Zod)
// ============================================================

export const AssetValidationSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  nameEn: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  typeId: z.string().min(1, 'نوع الأصل مطلوب'),
  roomId: z.string().min(1, 'الغرفة مطلوبة'),
  statusId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  operationDate: z.string().optional().nullable(),
  warrantyEnd: z.string().optional().nullable(),
  lastMaintenanceDate: z.string().optional().nullable(),
});

export type ValidatedAssetData = z.infer<typeof AssetValidationSchema>;

// ============================================================
// خيارات القائمة
// ============================================================

export interface ListAssetsOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  typeId?: string;
  roomId?: string;
  branchId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListAssetsResult {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}