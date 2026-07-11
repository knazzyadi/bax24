// src/app/[locale]/(dashboard)/assets/bulk-import/utils/dateHelpers.ts
export function formatDateInput(date: string | undefined): string {
  if (!date) return "";
  try {
    return new Date(date).toISOString().split("T")[0];
  } catch {
    return date;
  }
}