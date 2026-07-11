// src/app/[locale]/(dashboard)/assets/bulk-import/utils/csvValidation.ts
import { AssetRowSchema, BulkAssetRow } from '../types/bulkImport.types';
import { generateId } from './generateId';

/**
 * التحقق من صحة صف CSV واحد
 * - يستخدم AssetRowSchema المُحدَّث (مع serialNumber, manufacturer, model, supplier, operationDate)
 * - يُعيد كائن BulkAssetRow مع id فريد في حالة النجاح
 * - يُعيد قائمة بالأخطاء في حالة الفشل
 */
export function validateCSVRow(row: any): { valid: boolean; errors?: string[]; data?: BulkAssetRow } {
  const result = AssetRowSchema.safeParse(row);

  if (result.success) {
    return {
      valid: true,
      data: {
        id: generateId(),
        ...result.data,
      },
    };
  } else {
    const zodError = result.error;
    let errorMessages: string[] = [];

    if ('issues' in zodError && Array.isArray(zodError.issues)) {
      errorMessages = zodError.issues.map((err: any) => err.message);
    } else if ('errors' in zodError && Array.isArray((zodError as any).errors)) {
      errorMessages = (zodError as any).errors.map((err: any) => err.message);
    } else {
      errorMessages = ['بيانات الصف غير صالحة'];
    }

    return { valid: false, errors: errorMessages };
  }
}