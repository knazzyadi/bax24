// src/app/[locale]/(dashboard)/maintenance/utils.ts

import { addDays, addMonths, addYears } from 'date-fns';

/**
 * تحويل التردد النصي إلى عدد الأيام (للاستخدامات القديمة فقط)
 * @param freq - قيمة التردد (MONTHLY, QUARTERLY, SEMI_ANNUAL, YEARLY, CUSTOM)
 * @returns عدد الأيام المقابل للتردد، أو 0 للـ CUSTOM
 */
export function frequencyStringToDays(freq: string): number {
  switch (freq) {
    case 'MONTHLY':
      return 30;
    case 'QUARTERLY':
      return 90;
    case 'SEMI_ANNUAL':
      return 180;
    case 'YEARLY':
      return 365;
    case 'CUSTOM':
      return 0; // القيمة غير محددة، سيتم استخدام customDays
    default:
      return 30;
  }
}

/**
 * تحويل عدد الأيام إلى تردد نصي (عكسي) - لا يدعم CUSTOM
 * @param days - عدد الأيام
 * @returns قيمة التردد المقابلة
 */
export function daysToFrequencyString(days: number): string {
  if (days <= 30) return 'MONTHLY';
  if (days <= 90) return 'QUARTERLY';
  if (days <= 180) return 'SEMI_ANNUAL';
  return 'YEARLY';
}

/**
 * الحصول على أيام التردد من الكائن (مع إمكانية استخدام default)
 * @param frequency - قيمة التردد
 * @param customDays - عدد الأيام المخصص (اختياري)
 * @returns عدد الأيام النهائي
 */
export function getFrequencyDays(
  frequency: string,
  customDays?: number | null
): number {
  // إذا كان التردد CUSTOM ووجدت قيمة customDays صالحة
  if (frequency === 'CUSTOM' && customDays && customDays > 0) {
    return customDays;
  }
  // وإلا استخدم التردد المعروف (حتى لو كان CUSTOM ستعيد 0)
  return frequencyStringToDays(frequency);
}

/**
 * الحصول على التسمية المناسبة للتردد حسب اللغة
 * @param frequency - قيمة التردد (MONTHLY, QUARTERLY, SEMI_ANNUAL, YEARLY, CUSTOM)
 * @param isRtl - هل اللغة من اليمين لليسار (عربية)
 * @returns التسمية المناسبة للتردد باللغة المطلوبة
 */
export function getFrequencyLabel(frequency: string, isRtl: boolean): string {
  const map: Record<string, { ar: string; en: string }> = {
    MONTHLY: { ar: 'شهري', en: 'Monthly' },
    QUARTERLY: { ar: 'ربع سنوي', en: 'Quarterly' },
    SEMI_ANNUAL: { ar: 'نصف سنوي', en: 'Semi-annual' },
    YEARLY: { ar: 'سنوي', en: 'Yearly' },
    CUSTOM: { ar: 'مخصص', en: 'Custom' },
  };

  const entry = map[frequency];
  if (!entry) return frequency;

  return isRtl ? entry.ar : entry.en;
}

/**
 * الحصول على قائمة خيارات التردد مع تسمياتها (بما فيها CUSTOM)
 * @param isRtl - هل اللغة من اليمين لليسار (عربية)
 * @returns مصفوفة من كائنات { value, label }
 */
export function getFrequencyOptions(isRtl: boolean): { value: string; label: string }[] {
  const frequencies = ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'YEARLY', 'CUSTOM'];
  return frequencies.map((freq) => ({
    value: freq,
    label: getFrequencyLabel(freq, isRtl),
  }));
}

/**
 * التحقق من صحة تاريخ البدء
 * @param dateString - تاريخ البدء كـ string
 * @returns true إذا كان التاريخ صالحاً، false إذا كان غير صالح
 */
export function isValidStartDate(dateString: string): boolean {
  if (!dateString) return true; // التاريخ اختياري
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * حساب التاريخ التالي بناءً على التردد (موعد الصيانة فقط، بدون أيام التنبيه)
 * @param startDate - تاريخ البدء (أو آخر تاريخ صيانة)
 * @param frequency - التردد (MONTHLY, QUARTERLY, SEMI_ANNUAL, YEARLY, CUSTOM)
 * @param customDays - عدد الأيام المخصص (يُستخدم فقط إذا كان التردد CUSTOM)
 * @returns التاريخ التالي المتوقع (موعد الصيانة)
 */
export function calculateNextDate(
  startDate: Date | null,
  frequency: string,
  customDays?: number | null
): Date | null {
  if (!startDate) return null;

  const nextDate = new Date(startDate);

  switch (frequency) {
    case 'MONTHLY':
      return addMonths(nextDate, 1);
    case 'QUARTERLY':
      return addMonths(nextDate, 3);
    case 'SEMI_ANNUAL':
      return addMonths(nextDate, 6);
    case 'YEARLY':
      return addYears(nextDate, 1);
    case 'CUSTOM': {
      const days = customDays && customDays > 0 ? customDays : 30;
      return addDays(nextDate, days);
    }
    default:
      return addDays(nextDate, 30);
  }
}

/**
 * حساب تاريخ التنبيه (موعد التذكير) = تاريخ الصيانة - leadDays
 * @param dueDate - تاريخ الصيانة
 * @param leadDays - عدد أيام التحضير المسبق
 * @returns تاريخ التنبيه
 */
export function calculateReminderDate(dueDate: Date, leadDays: number): Date {
  const reminder = new Date(dueDate);
  reminder.setDate(reminder.getDate() - leadDays);
  return reminder;
}