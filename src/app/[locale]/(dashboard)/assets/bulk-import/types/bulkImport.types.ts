// src/app/[locale]/(dashboard)/assets/bulk-import/types/bulkImport.types.ts
import { z } from 'zod';

// تحويل السلسلة الفارغة إلى undefined لسهولة التعامل مع الحقول الاختيارية
const emptyToUndefined = (val: unknown) => (val === '' ? undefined : val);

export const AssetRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameEn: z.string().optional(),
  typeId: z.string().min(1, 'Type ID is required'),
  statusId: z.string().optional(),
  purchaseDate: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format (expected YYYY-MM-DD)',
    }),
  warrantyEnd: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format (expected YYYY-MM-DD)',
    }),
  lastMaintenanceDate: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format (expected YYYY-MM-DD)',
    }),
  notes: z.string().optional(),
});

export type BulkAssetRow = z.infer<typeof AssetRowSchema> & {
  id: string; // معرف محلي لـ React keys
};

export type ValidatedRow = {
  row: BulkAssetRow;
  errors?: string[];
};