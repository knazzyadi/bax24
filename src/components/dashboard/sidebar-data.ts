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
  Car,
  Building,
  Users,
  ShieldCheck,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

// قائمة العناصر الرئيسية (لغير السوبر أدمن)
export const MAIN_MENU_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/work-orders", labelKey: "nav.workOrders", icon: ClipboardList },
  { href: "/tickets", labelKey: "nav.tickets", icon: FileText },
  { href: "/maintenance", labelKey: "nav.maintenance", icon: Calendar },
  { href: "/vehicle-requests", labelKey: "nav.vehicles", icon: Car },
  { href: "/contracts", labelKey: "nav.contracts", icon: FileSpreadsheet },
  { href: "/assets", labelKey: "nav.assets", icon: Package },
  { href: "/inventory", labelKey: "nav.inventory", icon: Box },
];

// قائمة عناصر السوبر أدمن
export const SUPER_ADMIN_ITEMS: NavItem[] = [
  { href: "/super-admin", labelKey: "nav.superDashboard", icon: ShieldCheck },
  { href: "/super-admin/companies", labelKey: "nav.companies", icon: Building2 },
  { href: "/super-admin/branches", labelKey: "nav.branches", icon: Building },
  { href: "/super-admin/users", labelKey: "nav.users", icon: Users },
  { href: "/super-admin/settings", labelKey: "nav.settings", icon: Settings },
];