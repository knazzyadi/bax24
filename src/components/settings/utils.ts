// src/components/settings/utils.ts

import { LookupItem } from "./types";

/**
 * ترتيب حسب Order ثم الاسم
 */

export function sortLookupItems(items: LookupItem[]) {

  return [...items].sort((a, b) => {

    if (a.order !== b.order) {

      return a.order - b.order;

    }

    return a.name.localeCompare(b.name);

  });

}


/**
 * البحث
 */

export function searchLookupItems(

  items: LookupItem[],

  keyword: string

) {

  if (!keyword.trim()) return items;

  const q = keyword.toLowerCase();

  return items.filter((item) =>

    item.name.toLowerCase().includes(q) ||

    item.nameEn?.toLowerCase().includes(q) ||

    item.code?.toLowerCase().includes(q)

  );

}


/**
 * استخراج اللون
 */

export function getLookupColor(

  color?: string

) {

  return color || "#2563EB";

}


/**
 * إنشاء Code بسيط
 */

export function generateLookupCode(

  name: string

) {

  return name

    .trim()

    .replace(/\s+/g, "_")

    .toUpperCase();

}


/**
 * التحقق من وجود Default
 */

export function hasDefault(

  items: LookupItem[]

) {

  return items.some((x) => x.isDefault);

}


/**
 * الحصول على العنصر الافتراضي
 */

export function getDefaultItem(

  items: LookupItem[]

) {

  return items.find((x) => x.isDefault);

}


/**
 * ترتيب جديد
 */

export function getNextOrder(

  items: LookupItem[]

) {

  if (!items.length) return 1;

  return Math.max(...items.map((x) => x.order)) + 1;

}


/**
 * هل الكود مستخدم
 */

export function isCodeExists(

  items: LookupItem[],

  code: string,

  currentId?: string

) {

  return items.some(

    (x) =>

      x.code?.toLowerCase() === code.toLowerCase() &&

      x.id !== currentId

  );

}


/**
 * هل الاسم مستخدم
 */

export function isNameExists(

  items: LookupItem[],

  name: string,

  currentId?: string

) {

  return items.some(

    (x) =>

      x.name.trim() === name.trim() &&

      x.id !== currentId

  );

}