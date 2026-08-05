// src/app/[locale]/(dashboard)/assets/bulk-import/utils/csvValidation.ts

import { ZodIssue } from "zod";
import { AssetRowSchema, BulkAssetRow } from "./bulkImport.types";
import { generateId } from "./generateId";

interface ValidationResult {
  valid: boolean;
  errors?: string[];
  data?: BulkAssetRow;
}

/**
 * التحقق من صحة صف CSV واحد
 * - يستخدم AssetRowSchema
 * - يعيد BulkAssetRow عند النجاح
 * - يعيد قائمة بالأخطاء عند الفشل
 */
export function validateCSVRow(
  row: unknown
): ValidationResult {
  const result = AssetRowSchema.safeParse(row);

  if (result.success) {
    return {
      valid: true,
      data: {
        id: generateId(),
        ...result.data,
      },
    };
  }

  const zodError = result.error;

  let errorMessages: string[];

  if (Array.isArray(zodError.issues)) {
    errorMessages = zodError.issues.map(
      (err: ZodIssue) => err.message
    );
  } else {
    errorMessages = ["بيانات الصف غير صالحة"];
  }

  return {
    valid: false,
    errors: errorMessages,
  };
}