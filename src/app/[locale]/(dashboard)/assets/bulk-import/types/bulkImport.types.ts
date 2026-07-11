// src/app/[locale]/(dashboard)/assets/bulk-import/types/bulkImport.types.ts
import { z } from 'zod';

// ✅ تحديد نوع الإرجاع صراحةً ليكون string | undefined
const emptyToUndefined = (val: unknown): string | undefined => {
  if (typeof val !== 'string') return undefined;
  return val === '' ? undefined : val;
};

export const AssetRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  // descriptionEn تم إزالته
  typeId: z.string().min(1, 'Type ID is required'),
  statusId: z.string().optional(),

  purchaseDate: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .refine(
      (val): val is string | undefined => {
        if (!val) return true;
        return !isNaN(Date.parse(val));
      },
      { message: 'Invalid date format (expected YYYY-MM-DD)' }
    ),

  operationDate: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .refine(
      (val): val is string | undefined => {
        if (!val) return true;
        return !isNaN(Date.parse(val));
      },
      { message: 'Invalid date format (expected YYYY-MM-DD)' }
    ),

  warrantyEnd: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .refine(
      (val): val is string | undefined => {
        if (!val) return true;
        return !isNaN(Date.parse(val));
      },
      { message: 'Invalid date format (expected YYYY-MM-DD)' }
    ),

  lastMaintenanceDate: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .refine(
      (val): val is string | undefined => {
        if (!val) return true;
        return !isNaN(Date.parse(val));
      },
      { message: 'Invalid date format (expected YYYY-MM-DD)' }
    ),

  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

export type BulkAssetRow = z.infer<typeof AssetRowSchema> & {
  id: string;
};

export type ValidatedRow = {
  row: BulkAssetRow;
  errors?: string[];
};