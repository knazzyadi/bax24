// src/lib/assets/validation.ts

import { AssetValidationSchema, type ValidatedAssetData } from './types';
import { AssetValidationError } from './errors';

// ============================================================
// التحقق من صحة البيانات
// ============================================================

export function validateAssetData(data: unknown): ValidatedAssetData {
  const result = AssetValidationSchema.safeParse(data);
  if (!result.success) {
    // ✅ استخدم issues بدلاً من errors
    const errors = result.error.issues.map((e) => e.message).join(', ');
    throw new AssetValidationError(errors);
  }
  return result.data;
}

// ============================================================
// تطبيع البيانات
// ============================================================

export function normalizeAssetInput<T extends Record<string, unknown>>(
  data: T
): T {
  // ✅ استخدم Record<string, unknown> للفهرسة
  const result: Record<string, unknown> = { ...data };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === 'string') {
      result[key] = value.trim() === '' ? null : value.trim();
    }
  }
  return result as T;
}