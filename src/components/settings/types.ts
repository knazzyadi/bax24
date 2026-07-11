// src/components/settings/types.ts

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

/**
 * عنصر Lookup واحد
 */
export interface LookupItem {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  color?: string;
  icon?: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * المزايا التي تدعمها الصفحة
 */
export interface LookupFeatures {
  enableCode?: boolean;
  enableEnglishName?: boolean;
  enableColor?: boolean;
  enableDefault?: boolean;
  enableActive?: boolean;
  enableSorting?: boolean;
  enableSearch?: boolean;
}

/**
 * إعدادات الصفحة
 */
export interface LookupPageProps {
  title: string;
  description?: string;
  apiEndpoint: string;
  icon: LucideIcon;
  features: LookupFeatures;
  permissions?: {
    create?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  confirmDelete?: boolean;
}

/**
 * تعريف أعمدة الجدول
 */
export interface LookupColumn<T> {
  key: keyof T | string;
  title: string;
  width?: string | number;
  align?: "left" | "center" | "right";
  render?: (item: T) => ReactNode;
}

/**
 * بيانات الفورم
 */
export interface LookupFormData {
  id?: string;
  name: string;
  nameEn?: string;
  code?: string;
  color?: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}

/**
 * خيار لون
 */
export interface ColorOption {
  name: string;
  value: string;
}