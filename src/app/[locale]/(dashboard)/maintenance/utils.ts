// src/app/[locale]/(dashboard)/maintenance/utils.ts

/**
 * تحويل التردد النصي إلى عدد الأيام
 * @param freq - قيمة التردد (MONTHLY, QUARTERLY, SEMI_ANNUAL, YEARLY)
 * @returns عدد الأيام المقابل للتردد
 */
export function frequencyStringToDays(freq: string): number {
  switch (freq) {
    case "MONTHLY":
      return 30;
    case "QUARTERLY":
      return 90;
    case "SEMI_ANNUAL":
      return 180;
    case "YEARLY":
      return 365;
    default:
      return 30;
  }
}

/**
 * تحويل عدد الأيام إلى تردد نصي (عكسي)
 * @param days - عدد الأيام
 * @returns قيمة التردد المقابلة
 */
export function daysToFrequencyString(days: number): string {
  if (days <= 30) return "MONTHLY";
  if (days <= 90) return "QUARTERLY";
  if (days <= 180) return "SEMI_ANNUAL";
  return "YEARLY";
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
  if (customDays && customDays > 0) {
    return customDays;
  }
  return frequencyStringToDays(frequency);
}

/**
 * الحصول على التسمية المناسبة للتردد حسب اللغة
 * @param frequency - قيمة التردد (MONTHLY, QUARTERLY, SEMI_ANNUAL, YEARLY)
 * @param isRtl - هل اللغة من اليمين لليسار (عربية)
 * @returns التسمية المناسبة للتردد باللغة المطلوبة
 */
export function getFrequencyLabel(frequency: string, isRtl: boolean): string {
  const map: Record<string, { ar: string; en: string }> = {
    MONTHLY: { ar: "شهري", en: "Monthly" },
    QUARTERLY: { ar: "ربع سنوي", en: "Quarterly" },
    SEMI_ANNUAL: { ar: "نصف سنوي", en: "Semi-annual" },
    YEARLY: { ar: "سنوي", en: "Yearly" },
  };

  const entry = map[frequency];
  if (!entry) return frequency;

  return isRtl ? entry.ar : entry.en;
}

/**
 * الحصول على قائمة خيارات التردد مع تسمياتها
 * @param isRtl - هل اللغة من اليمين لليسار (عربية)
 * @returns مصفوفة من كائنات { value, label }
 */
export function getFrequencyOptions(isRtl: boolean): { value: string; label: string }[] {
  const frequencies = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "YEARLY"];
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
 * حساب التاريخ التالي بناءً على التردد وأيام التحضير المسبق
 * @param startDate - تاريخ البدء
 * @param frequency - التردد
 * @param leadDays - أيام التحضير المسبق
 * @returns التاريخ التالي المتوقع
 */
export function calculateNextDate(
  startDate: Date | null,
  frequency: string,
  leadDays: number
): Date | null {
  if (!startDate) return null;

  const nextDate = new Date(startDate);
  const days = frequencyStringToDays(frequency);

  // إضافة أيام التردد
  nextDate.setDate(nextDate.getDate() + days);

  // إضافة أيام التحضير المسبق
  if (leadDays > 0) {
    nextDate.setDate(nextDate.getDate() + leadDays);
  }

  return nextDate;
}