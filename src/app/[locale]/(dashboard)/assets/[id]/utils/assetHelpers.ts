// src/app/[locale]/(dashboard)/assets/[id]/utils/assetHelpers.ts

export function getDisplayName(
  item?: { name: string; nameEn?: string },
  isRtl?: boolean
): string {
  if (!item) return "—";
  if (isRtl === undefined) {
    return item.name;
  }
  return isRtl ? item.name : item.nameEn || item.name;
}

export function formatDate(dateStr?: string, isRtl?: boolean): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(isRtl ? "ar-SA" : "en-US");
  } catch {
    return dateStr;
  }
}

export function getSupplierDisplayName(
  asset: { supplierName?: string | null; supplierNameEn?: string | null },
  isRtl?: boolean
): string {
  if (!asset.supplierName && !asset.supplierNameEn) return "—";
  if (isRtl) {
    return asset.supplierName || asset.supplierNameEn || "—";
  }
  return asset.supplierNameEn || asset.supplierName || "—";
}