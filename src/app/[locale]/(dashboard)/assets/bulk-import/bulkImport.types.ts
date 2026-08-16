import { z } from "zod";

// ============================================================
// دوال مساعدة
// ============================================================

const emptyToUndefined = (val: unknown): string | undefined => {
  if (typeof val !== "string") return undefined;
  return val.trim() === "" ? undefined : val.trim();
};

// ============================================================
// مخطط صف الأصل
// ============================================================

export const AssetRowSchema = z.object({
  // ----------------------------------------------------------
  // بيانات الموقع - تستخدم في وضع استيراد المبنى الكامل
  // ----------------------------------------------------------

  floorCode: z
    .string()
    .optional()
    .transform(emptyToUndefined),

  roomCode: z
    .string()
    .optional()
    .transform(emptyToUndefined),

  // ----------------------------------------------------------
  // بيانات الأصل
  // ----------------------------------------------------------

  name: z.string().min(1, "Name is required"),

  nameEn: z.string().optional(),

  description: z.string().optional(),

  // descriptionEn تم إزالته

  typeId: z.string().min(1, "Type ID is required"),

  statusId: z.string().optional(),

  // ----------------------------------------------------------
  // التواريخ
  // ----------------------------------------------------------

  purchaseDate: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .refine(
      (val): val is string | undefined => {
        if (!val) return true;

        return !isNaN(Date.parse(val));
      },
      {
        message: "Invalid date format (expected YYYY-MM-DD)",
      }
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
      {
        message: "Invalid date format (expected YYYY-MM-DD)",
      }
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
      {
        message: "Invalid date format (expected YYYY-MM-DD)",
      }
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
      {
        message: "Invalid date format (expected YYYY-MM-DD)",
      }
    ),

  // ----------------------------------------------------------
  // بيانات إضافية
  // ----------------------------------------------------------

  serialNumber: z.string().optional(),

  manufacturer: z.string().optional(),

  model: z.string().optional(),

  supplier: z.string().optional(),

  notes: z.string().optional(),
});

// ============================================================
// نوع صف الأصل
// ============================================================

export type BulkAssetRow = z.infer<typeof AssetRowSchema> & {
  id: string;
};

// ============================================================
// نتيجة التحقق من الصف
// ============================================================

export type ValidatedRow = {
  row: BulkAssetRow;
  errors?: string[];
};