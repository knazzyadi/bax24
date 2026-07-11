// src/components/settings/constants.ts

import { ColorOption } from "./types";

/**
 * لوحة الألوان الموحدة للنظام
 */

export const LOOKUP_COLORS: ColorOption[] = [

  { name: "Blue", value: "#2563EB" },

  { name: "Green", value: "#16A34A" },

  { name: "Orange", value: "#EA580C" },

  { name: "Red", value: "#DC2626" },

  { name: "Purple", value: "#9333EA" },

  { name: "Pink", value: "#DB2777" },

  { name: "Teal", value: "#0F766E" },

  { name: "Cyan", value: "#0891B2" },

  { name: "Amber", value: "#D97706" },

  { name: "Slate", value: "#475569" }

];


/**
 * اللون الافتراضي
 */

export const DEFAULT_LOOKUP_COLOR = "#2563EB";


/**
 * ترتيب البداية
 */

export const DEFAULT_ORDER = 1;


/**
 * نموذج جديد
 */

export const EMPTY_LOOKUP_FORM = {

  name: "",

  nameEn: "",

  code: "",

  color: DEFAULT_LOOKUP_COLOR,

  order: DEFAULT_ORDER,

  isDefault: false,

  isActive: true,

};