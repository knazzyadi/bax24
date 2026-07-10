// src/app/[locale]/(dashboard)/assets/[id]/utils/assetHelpers.ts

/**
 * عرض الاسم حسب اللغة (RTL/LTR)
 */
export function getDisplayName(
  item?: { name: string; nameEn?: string },
  isRtl?: boolean
): string {
  if (!item) return "—";
  if (isRtl === undefined) {
    // إذا لم يتم تمرير isRtl، نستخدم اللغة من المتصفح
    // لكن الأفضل تمريرها من المكون
    return item.name;
  }
  return isRtl ? item.name : item.nameEn || item.name;
}

/**
 * تنسيق التاريخ
 */
export function formatDate(dateStr?: string, isRtl?: boolean): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(isRtl ? "ar-SA" : "en-US");
  } catch {
    return dateStr;
  }
}