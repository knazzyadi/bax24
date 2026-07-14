// src/lib/assets/validation.ts

import { AssetValidationSchema, type ValidatedAssetData } from './types';
import { AssetValidationError } from './errors';

// ============================================================
// التحقق من صحة البيانات
// ============================================================

export function validateAssetData(data: unknown): ValidatedAssetData {
  const result = AssetValidationSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message).join(', ');
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
  const result = { ...data };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === 'string') {
      result[key] = value.trim() === '' ? null : value.trim() as T[keyof T];
    }
  }
  return result;
}