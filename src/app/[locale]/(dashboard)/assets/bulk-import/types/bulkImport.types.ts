import { z } from 'zod';

// تحويل السلسلة الفارغة إلى undefined
const emptyToUndefined = (val: unknown) => (val === '' ? undefined : val);

export const AssetRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameEn: z.string().optional(),
  description: z.string().optional(),        // ✅ وصف عربي
  descriptionEn: z.string().optional(),      // ✅ وصف إنجليزي
  typeId: z.string().min(1, 'Type ID is required'),
  statusId: z.string().optional(),
  purchaseDate: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .refine(
      (val) => {
        if (!val) return true;
        if (typeof val !== 'string') return false;
        return !isNaN(Date.parse(val));
      },
      { message: 'Invalid date format (expected YYYY-MM-DD)' }
    ),
  warrantyEnd: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .refine(
      (val) => {
        if (!val) return true;
        if (typeof val !== 'string') return false;
        return !isNaN(Date.parse(val));
      },
      { message: 'Invalid date format (expected YYYY-MM-DD)' }
    ),
  lastMaintenanceDate: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .refine(
      (val) => {
        if (!val) return true;
        if (typeof val !== 'string') return false;
        return !isNaN(Date.parse(val));
      },
      { message: 'Invalid date format (expected YYYY-MM-DD)' }
    ),
  notes: z.string().optional(),
});

export type BulkAssetRow = z.infer<typeof AssetRowSchema> & {
  id: string; // معرف محلي لـ React keys
};

export type ValidatedRow = {
  row: BulkAssetRow;
  errors?: string[];
};