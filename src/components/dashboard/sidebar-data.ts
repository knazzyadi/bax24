// src/components/dashboard/sidebar-data.ts
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Box,
  Calendar,
  FileText,
  FileSpreadsheet,
  Building2,
  Building,
  Users,
  ShieldCheck,
  Settings,
  MapPin,
  Wrench,
  AlertCircle,
  CheckCircle,
  XCircle,
  Flag,
  Layers,
  ListChecks,
  Home,
  ClipboardCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href?: string;
  labelKey: string;
  icon: LucideIcon;
  children?: NavItem[];
}

export const MAIN_MENU_ITEMS: NavItem[] = [
  // =========================
  // 1. الرئيسية
  // =========================
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },

  // =========================
  // 2. أوامر العمل
  // =========================
  { href: "/work-orders", labelKey: "nav.workOrders", icon: ClipboardList },

  // =========================
  // 4. التذاكر
  // =========================
  { href: "/tickets", labelKey: "nav.tickets", icon: FileText },

  // =========================
  // 5. الصيانة الدورية
  // =========================
  { href: "/maintenance", labelKey: "nav.maintenance", icon: Calendar },
  
  // =========================
  // ✅ 3. الفحص (جديد - بعد أوامر العمل وقبل العقود)
  // =========================
  { href: "/inspections", labelKey: "nav.inspections", icon: ClipboardCheck },

  // =========================
  // 6. العقود
  // =========================
  { href: "/contracts", labelKey: "nav.contracts", icon: FileSpreadsheet },

  // =========================
  // 7. الأصول
  // =========================
  { href: "/assets", labelKey: "nav.assets", icon: Package },

  // =========================
  // 8. المخزون
  // =========================
  { href: "/inventory", labelKey: "nav.inventory", icon: Box },

  // =========================
  // 9. التقارير
  // =========================
  { href: "/reports", labelKey: "nav.reports", icon: FileText },

  // =========================
  // 10. الإعدادات
  // =========================
  {
    labelKey: "nav.settingsTitle",
    icon: Settings,
    children: [
      // =========================
      // 1. المواقع
      // =========================
      {
        labelKey: "nav.settings.locations",
        icon: MapPin,
        children: [
          { href: "/locations/buildings", labelKey: "nav.buildings", icon: Building },
          { href: "/locations/floors", labelKey: "nav.floors", icon: Layers },
          { href: "/locations/rooms", labelKey: "nav.rooms", icon: Home },
        ],
      },

      // =========================
      // ✅ 2. أوامر العمل (الإعدادات)
      // =========================
      {
        labelKey: "nav.settings.workOrders",
        icon: ListChecks,
        children: [
          { href: "/settings/work-order-types", labelKey: "nav.settings.workOrderTypes", icon: Wrench },
          { href: "/settings/work-order-priorities", labelKey: "nav.settings.workOrderPriorities", icon: Flag },
          { href: "/settings/work-order-statuses", labelKey: "nav.settings.workOrderStatuses", icon: AlertCircle },
          { href: "/settings/work-order-close-reasons", labelKey: "nav.settings.workOrderCloseReasons", icon: CheckCircle },
          { href: "/settings/work-order-cancel-reasons", labelKey: "nav.settings.workOrderCancelReasons", icon: XCircle },
        ],
      },

      // =========================
      // ✅ 3. الفحص (الإعدادات) - تحت أوامر العمل مباشرة
      // =========================
      {
        labelKey: "nav.settings.inspections",
        icon: ClipboardCheck,
        children: [
          {
            href: "/settings/inspection-types",
            labelKey: "nav.settings.inspectionTypes",
            icon: ClipboardCheck,
          },
        ],
      },

      // =========================
      // 4. الأصول (الإعدادات)
      // =========================
      {
        labelKey: "nav.settings.assets",
        icon: Layers,
        children: [
          { href: "/settings/asset-types", labelKey: "nav.settings.assetTypes", icon: Package },
          { href: "/settings/asset-statuses", labelKey: "nav.settings.assetStatuses", icon: CheckCircle },
        ],
      },

      // =========================
      // 5. الموردون
      // =========================
      { href: "/settings/suppliers", labelKey: "nav.settings.suppliers", icon: Building2 },

      // =========================
      // 6. المستخدمون
      // =========================
      { href: "/users", labelKey: "nav.settings.users", icon: Users },

      // =========================
      // 7. الصلاحيات
      // =========================
      { href: "/settings/roles", labelKey: "nav.settings.roles", icon: ShieldCheck },
    ],
  },
];

// =========================
// Super Admin
// =========================
export const SUPER_ADMIN_ITEMS: NavItem[] = [
  {
    href: "/super-admin",
    labelKey: "nav.superDashboard",
    icon: ShieldCheck,
  },
  {
    href: "/super-admin/companies",
    labelKey: "nav.companies",
    icon: Building2,
  },
  {
    href: "/super-admin/branches",
    labelKey: "nav.branches",
    icon: Building,
  },
  {
    href: "/super-admin/users",
    labelKey: "nav.users",
    icon: Users,
  },
  {
    href: "/super-admin/settings",
    labelKey: "nav.settingsTitle",
    icon: Settings,
  },
];