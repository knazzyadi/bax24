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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// واجهة تدعم القوائم المتداخلة
export interface NavItem {
  href?: string;
  labelKey: string;
  icon: LucideIcon;
  children?: NavItem[];
}

// =========================
// القائمة الرئيسية
// =========================
export const MAIN_MENU_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/work-orders", labelKey: "nav.workOrders", icon: ClipboardList },
  { href: "/tickets", labelKey: "nav.tickets", icon: FileText },
  { href: "/maintenance", labelKey: "nav.maintenance", icon: Calendar },
  { href: "/contracts", labelKey: "nav.contracts", icon: FileSpreadsheet },
  { href: "/assets", labelKey: "nav.assets", icon: Package },
  { href: "/inventory", labelKey: "nav.inventory", icon: Box },
  { href: "/reports", labelKey: "nav.reports", icon: FileText },

  // =========================
  // Settings
  // =========================
  {
    labelKey: "nav.settingsTitle",
    icon: Settings,
    children: [
      // =========================
      // ✅ Locations (بدون href، قائمة فرعية فقط)
      // =========================
      {
        labelKey: "nav.settings.locations",
        icon: MapPin,
        children: [
          {
            href: "/locations/buildings",
            labelKey: "nav.buildings",
            icon: Building,
          },
          {
            href: "/locations/floors",
            labelKey: "nav.floors",
            icon: Layers,
          },
          {
            href: "/locations/rooms",
            labelKey: "nav.rooms",
            icon: Home,
          },
        ],
      },

      // Assets
      {
        labelKey: "nav.settings.assets",
        icon: Layers,
        children: [
          {
            href: "/settings/asset-types",
            labelKey: "nav.settings.assetTypes",
            icon: Package,
          },
          {
            href: "/settings/asset-statuses",
            labelKey: "nav.settings.assetStatuses",
            icon: CheckCircle,
          },
        ],
      },

      // Work Orders
      {
        labelKey: "nav.settings.workOrders",
        icon: ListChecks,
        children: [
          {
            href: "/settings/work-order-types",
            labelKey: "nav.settings.workOrderTypes",
            icon: Wrench,
          },
          {
            href: "/settings/work-order-priorities",
            labelKey: "nav.settings.workOrderPriorities",
            icon: Flag,
          },
          {
            href: "/settings/work-order-statuses",
            labelKey: "nav.settings.workOrderStatuses",
            icon: AlertCircle,
          },
          {
            href: "/settings/work-order-close-reasons",
            labelKey: "nav.settings.workOrderCloseReasons",
            icon: CheckCircle,
          },
          {
            href: "/settings/work-order-cancel-reasons",
            labelKey: "nav.settings.workOrderCancelReasons",
            icon: XCircle,
          },
        ],
      },

      // Suppliers
      {
        href: "/settings/suppliers",
        labelKey: "nav.settings.suppliers",
        icon: Building2,
      },

      // Users
        {
          href: "/users",
          labelKey: "nav.settings.users",
          icon: Users,
        },

      // Roles
      {
        href: "/settings/roles",
        labelKey: "nav.settings.roles",
        icon: ShieldCheck,
      },
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