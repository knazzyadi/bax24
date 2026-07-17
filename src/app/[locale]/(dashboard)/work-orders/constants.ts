// src/app/[locale]/(dashboard)/work-orders/constants.ts

import {
  AlertCircle,
  Wrench,
  ClipboardCheck,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PriorityCode, StatusCode, WorkOrderType, WorkOrderSource, WorkOrderCategory } from "./types";

// ============================================================
// الثابت الأساسي للبطاقات الزجاجية
// ============================================================

export const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

// ============================================================
// أنواع أوامر العمل
// ============================================================

export const WORK_ORDER_TYPES: Record<WorkOrderType, { labelAr: string; labelEn: string }> = {
  MAINTENANCE: { labelAr: "صيانة", labelEn: "Maintenance" },
  CORRECTIVE: { labelAr: "إصلاح", labelEn: "Corrective" },
  EMERGENCY: { labelAr: "طوارئ", labelEn: "Emergency" },
  BULK_PREVENTIVE: { labelAr: "وقائية مجمعة", labelEn: "Bulk Preventive" },
} as const;

// ============================================================
// مصادر أوامر العمل
// ============================================================

export const WORK_ORDER_SOURCES: Record<WorkOrderSource, { labelAr: string; labelEn: string; icon: LucideIcon }> = {
  ticket: { labelAr: "بلاغ", labelEn: "Ticket", icon: AlertCircle },
  pm: { labelAr: "صيانة وقائية", labelEn: "Preventive Maintenance", icon: Wrench },
  checklist: { labelAr: "قائمة فحص", labelEn: "Checklist", icon: ClipboardCheck },
  manual: { labelAr: "إنشاء مباشر", labelEn: "Manual", icon: Plus },
} as const;

// ============================================================
// أولويات أوامر العمل
// ============================================================

export const WORK_ORDER_PRIORITIES: Record<PriorityCode, { labelAr: string; labelEn: string; color: string }> = {
  LOW: { labelAr: "منخفضة", labelEn: "Low", color: "#94a3b8" },
  MEDIUM: { labelAr: "متوسطة", labelEn: "Medium", color: "#f59e0b" },
  HIGH: { labelAr: "عالية", labelEn: "High", color: "#f97316" },
  EMERGENCY: { labelAr: "طارئ", labelEn: "Emergency", color: "#ef4444" },
} as const;

// ============================================================
// فئات أوامر العمل
// ============================================================

export const WORK_ORDER_CATEGORIES: Record<WorkOrderCategory, { labelAr: string; labelEn: string }> = {
  ELECTRICAL: { labelAr: "كهرباء", labelEn: "Electrical" },
  MECHANICAL: { labelAr: "ميكانيكا", labelEn: "Mechanical" },
  HVAC: { labelAr: "تكييف وتهوية", labelEn: "HVAC" },
  MEDICAL: { labelAr: "طبي", labelEn: "Medical" },
  FIRE: { labelAr: "حريق", labelEn: "Fire" },
  IT: { labelAr: "تقنية معلومات", labelEn: "IT" },
  CIVIL: { labelAr: "مدني", labelEn: "Civil" },
  OTHER: { labelAr: "أخرى", labelEn: "Other" },
} as const;

// ============================================================
// حالات أوامر العمل
// ============================================================

export const WORK_ORDER_STATUSES: Record<StatusCode, { labelAr: string; labelEn: string; color: string }> = {
  PENDING: { labelAr: "معلق", labelEn: "Pending", color: "#f59e0b" },
  IN_PROGRESS: { labelAr: "قيد التنفيذ", labelEn: "In Progress", color: "#3b82f6" },
  COMPLETED: { labelAr: "مكتمل", labelEn: "Completed", color: "#22c55e" },
  CANCELLED: { labelAr: "ملغي", labelEn: "Cancelled", color: "#ef4444" },
  ON_HOLD: { labelAr: "معلق", labelEn: "On Hold", color: "#8b5cf6" },
} as const;

// ============================================================
// تكوينات الحالات والأولويات (للعرض)
// ============================================================

export const STATUS_CONFIG: Record<StatusCode, { icon: LucideIcon; fallbackColor: string; glow: string }> = {
  COMPLETED: { icon: CheckCircle2, fallbackColor: "#22c55e", glow: "shadow-emerald-500/20" },
  IN_PROGRESS: { icon: Clock, fallbackColor: "#3b82f6", glow: "shadow-blue-500/20" },
  CANCELLED: { icon: XCircle, fallbackColor: "#ef4444", glow: "shadow-rose-500/20" },
  PENDING: { icon: AlertCircle, fallbackColor: "#f59e0b", glow: "shadow-amber-500/20" },
  ON_HOLD: { icon: AlertCircle, fallbackColor: "#8b5cf6", glow: "shadow-purple-500/20" },
} as const;

export const PRIORITY_CONFIG: Record<PriorityCode, { icon: LucideIcon; fallbackColor: string; glow: string }> = {
  LOW: { icon: Clock, fallbackColor: "#22c55e", glow: "shadow-emerald-500/20" },
  MEDIUM: { icon: AlertCircle, fallbackColor: "#3b82f6", glow: "shadow-blue-500/20" },
  HIGH: { icon: AlertTriangle, fallbackColor: "#f59e0b", glow: "shadow-amber-500/20" },
  EMERGENCY: { icon: AlertCircle, fallbackColor: "#ef4444", glow: "shadow-rose-500/20" },
} as const;