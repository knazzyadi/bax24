// lib/reports-utils.ts
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

/**
 * تنسيق التاريخ بالعربية
 */
export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), "dd MMMM yyyy", { locale: ar });
  } catch {
    return dateString;
  }
}

/**
 * حساب نسبة الإنجاز
 */
export function calculateCompletionRate(total: number, completed: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * الحصول على لون الحالة
 */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    completed: "bg-green-100 text-green-800 border-green-300",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    "in-progress": "bg-blue-100 text-blue-800 border-blue-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
  };
  return map[status] || "bg-gray-100 text-gray-800 border-gray-300";
}

/**
 * ترجمة الحالة إلى العربية
 */
export function translateStatus(status: string): string {
  const map: Record<string, string> = {
    completed: "مكتمل",
    pending: "معلق",
    "in-progress": "قيد التنفيذ",
    cancelled: "ملغي",
  };
  return map[status] || status;
}