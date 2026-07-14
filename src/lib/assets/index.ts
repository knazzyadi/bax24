// src/lib/assets/index.ts

// ============================================================
// تصدير الدوال الرئيسية
// ============================================================

export { createAsset } from './create';
export { updateAsset } from './update';
export { deleteAsset, bulkDeleteAssets } from './delete';
export { getAsset } from './get';
export { listAssets } from './list';

// ============================================================
// تصدير دوال التحقق والمساعدة
// ============================================================

export { validateAssetData, normalizeAssetInput } from './validation';
export { generateAssetCode, serializeAsset, serializeAssetList } from './helpers';
export { createAuditLog, buildDiff } from './audit';

// ============================================================
// تصدير دوال الصلاحيات
// ============================================================

export {
  ensureCanCreateAsset,
  ensureCanEditAsset,
  ensureCanDeleteAsset,
  ensureCanViewAsset,
  ensureAssetAccess,
  ensureBranchAccess,
  ensureCompanyAccess,
  getAllowedBranchIds,
  getAllowedCompanyId,
  filterAllowedAssetIds,
  ensureHasAnyBranchAccess,
  type AuthSession,
} from './permissions';

// ============================================================
// تصدير الأخطاء
// ============================================================

export {
  AssetError,
  AssetNotFoundError,
  AssetDuplicateError,
  AssetValidationError,
  AssetBusinessError,
  AssetPermissionError,
  handlePrismaError,
  getErrorResponse,
  getErrorResponseStatus,
} from './errors';

// ============================================================
// تصدير الأنواع
// ============================================================

export type {
  CreateAssetInput,
  UpdateAssetInput,
  ValidatedAssetData,
  ListAssetsOptions,
  ListAssetsResult,
} from './types';

export type { AssetResponse } from './helpers';
export type { AuditAction, AuditLogChanges } from './audit';