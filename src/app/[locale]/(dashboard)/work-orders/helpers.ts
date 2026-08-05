// src/app/[locale]/(dashboard)/work-orders/helpers.ts
import { Prisma } from "@prisma/client";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { WorkOrder } from "./types";

// ============================================================
// تعريف علاقات أمر العمل للاستعلامات المتكررة
// ============================================================
export const WORK_ORDER_INCLUDE = {
  priority: {
    select: {
      id: true,
      code: true,
      name: true,
      nameEn: true,
      color: true,
    },
  },
  status: {
    select: {
      id: true,
      code: true,
      name: true,
      nameEn: true,
      color: true,
    },
  },
  branch: { select: { id: true, name: true, nameEn: true } },
  building: { select: { id: true, name: true, nameEn: true } },
  floor: { select: { id: true, name: true, nameEn: true } },
  room: { select: { id: true, name: true, nameEn: true } },
  assetType: { select: { id: true, name: true, nameEn: true } },
  workOrderAssets: {
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          code: true,
        },
      },
    },
  },
  ticket: { select: { id: true, title: true, description: true, code: true } },
  workOrderType: { select: { id: true, name: true, nameEn: true } },
  createdByUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  assignedUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.WorkOrderInclude;

// ============================================================
// نوع البيانات المحولة – يعتمد مباشرة على WorkOrder
// ============================================================
export type TransformedWorkOrder = WorkOrder;

// ============================================================
// دالة تحويل أمر العمل (تعيد WorkOrder)
// ============================================================
export function mapWorkOrder(
  workOrder: Prisma.WorkOrderGetPayload<{ include: typeof WORK_ORDER_INCLUDE }>,
  locale: string
): TransformedWorkOrder {
  const isRtl = locale === "ar";

  const locationParts = [];

  if (workOrder.branch) {
    locationParts.push(
      isRtl
        ? workOrder.branch.name
        : workOrder.branch.nameEn || workOrder.branch.name
    );
  }

  if (workOrder.building) {
    locationParts.push(
      isRtl
        ? workOrder.building.name
        : workOrder.building.nameEn || workOrder.building.name
    );
  }

  if (workOrder.floor) {
    locationParts.push(
      isRtl
        ? workOrder.floor.name
        : workOrder.floor.nameEn || workOrder.floor.name
    );
  }

  if (workOrder.room) {
    locationParts.push(
      isRtl
        ? workOrder.room.name
        : workOrder.room.nameEn || workOrder.room.name
    );
  }

  const locationString = locationParts.length > 0 ? locationParts.join(" - ") : "";
  const assetCount = workOrder.workOrderAssets?.length || 0;

  const source = workOrder.source ?? "manual";

  return {
    id: workOrder.id,
    code: workOrder.code ?? `WO-${workOrder.id.slice(-4)}`,
    title: workOrder.title,
    description: workOrder.description,
    type: workOrder.type,
    priority: workOrder.priority
      ? {
          id: workOrder.priority.id,
          code: workOrder.priority.code ?? undefined,
          name: workOrder.priority.name,
          nameEn: workOrder.priority.nameEn ?? undefined,
          color: workOrder.priority.color ?? undefined,
        }
      : null,
    status: workOrder.status
      ? {
          id: workOrder.status.id,
          code: workOrder.status.code ?? undefined,
          name: workOrder.status.name,
          nameEn: workOrder.status.nameEn ?? undefined,
          color: workOrder.status.color ?? undefined,
        }
      : null,
    branch: workOrder.branch
      ? {
          id: workOrder.branch.id,
          name: workOrder.branch.name,
          nameEn: workOrder.branch.nameEn ?? undefined,
        }
      : null,
    building: workOrder.building
      ? {
          id: workOrder.building.id,
          name: workOrder.building.name,
          nameEn: workOrder.building.nameEn ?? undefined,
        }
      : null,
    floor: workOrder.floor
      ? {
          id: workOrder.floor.id,
          name: workOrder.floor.name,
          nameEn: workOrder.floor.nameEn ?? undefined,
        }
      : null,
    room: workOrder.room
      ? {
          id: workOrder.room.id,
          name: workOrder.room.name,
          nameEn: workOrder.room.nameEn ?? undefined,
        }
      : null,
    locationString,
    assetType: workOrder.assetType
      ? {
          id: workOrder.assetType.id,
          name: workOrder.assetType.name,
          nameEn: workOrder.assetType.nameEn ?? undefined,
        }
      : null,
    workOrderAssets:
      workOrder.workOrderAssets?.map((woa) => ({
        assetId: woa.assetId,
        completedAt: woa.completedAt?.toISOString() ?? null,
        notes: woa.notes,
        asset: {
          id: woa.asset.id,
          name: woa.asset.name,
          nameEn: woa.asset.nameEn ?? undefined,
          code: woa.asset.code,
        },
      })) ?? [],
    assetCount,
    ticket: workOrder.ticket
      ? {
          id: workOrder.ticket.id,
          title: workOrder.ticket.title,
          description: workOrder.ticket.description,
          code: workOrder.ticket.code,
        }
      : null,
    workOrderType: workOrder.workOrderType
      ? {
          id: workOrder.workOrderType.id,
          name: workOrder.workOrderType.name,
          nameEn: workOrder.workOrderType.nameEn ?? undefined,
        }
      : null,
    createdAt: workOrder.createdAt.toISOString(),
    updatedAt: workOrder.updatedAt.toISOString(),
    notes: workOrder.notes ?? null,
    attachments: [],
    createdBy: workOrder.createdByUser
      ? {
          id: workOrder.createdByUser.id,
          name: workOrder.createdByUser.name ?? "غير معروف",
          email: workOrder.createdByUser.email,
        }
      : null,
    assignedTo: workOrder.assignedUser
      ? {
          id: workOrder.assignedUser.id,
          name: workOrder.assignedUser.name ?? "غير معروف",
          email: workOrder.assignedUser.email,
        }
      : null,
    source,
    sourceId: workOrder.sourceId ?? null,
    reason: workOrder.reason ?? null,
  };
}

// ============================================================
// تكوينات الحالات والأولويات
// ============================================================
const STATUS_CONFIG: Record<string, { icon: LucideIcon; fallbackColor: string; glow: string }> = {
  COMPLETED: { icon: CheckCircle2, fallbackColor: "#22c55e", glow: "shadow-emerald-500/20" },
  IN_PROGRESS: { icon: Clock, fallbackColor: "#3b82f6", glow: "shadow-blue-500/20" },
  CANCELLED: { icon: XCircle, fallbackColor: "#ef4444", glow: "shadow-rose-500/20" },
  PENDING: { icon: AlertCircle, fallbackColor: "#f59e0b", glow: "shadow-amber-500/20" },
  ON_HOLD: { icon: AlertCircle, fallbackColor: "#8b5cf6", glow: "shadow-purple-500/20" },
};

const PRIORITY_CONFIG: Record<string, { icon: LucideIcon; fallbackColor: string; glow: string }> = {
  LOW: { icon: Clock, fallbackColor: "#22c55e", glow: "shadow-emerald-500/20" },
  MEDIUM: { icon: AlertCircle, fallbackColor: "#3b82f6", glow: "shadow-blue-500/20" },
  HIGH: { icon: AlertTriangle, fallbackColor: "#f59e0b", glow: "shadow-amber-500/20" },
  EMERGENCY: { icon: AlertCircle, fallbackColor: "#ef4444", glow: "shadow-rose-500/20" },
  CRITICAL: { icon: AlertCircle, fallbackColor: "#ef4444", glow: "shadow-rose-500/20" },
};

// ============================================================
// دوال مساعدة للعرض (معدلة لقبول null)
// ============================================================
export function getStatusDisplay(
  status: {
    code?: string | null;
    name: string;
    nameEn?: string | null;
    color?: string | null;
  } | null,
  isRtl: boolean = false
): { label: string; icon: LucideIcon; hex: string; glow: string } {
  if (!status) {
    return {
      label: isRtl ? "بدون حالة" : "No Status",
      icon: AlertCircle,
      hex: "#6b7280",
      glow: "shadow-slate-500/20",
    };
  }
  const configKey = status.code || status.name?.toUpperCase() || "PENDING";
  const config = STATUS_CONFIG[configKey] || STATUS_CONFIG["PENDING"];
  return {
    label: isRtl ? status.name : status.nameEn || status.name,
    icon: config.icon,
    hex: status.color || config.fallbackColor,
    glow: config.glow,
  };
}

export function getPriorityDisplay(
  priority: {
    code?: string | null;
    name: string;
    nameEn?: string | null;
    color?: string | null;
  } | null,
  isRtl: boolean = false
): { label: string; icon: LucideIcon; hex: string; glow: string } {
  if (!priority) {
    return {
      label: isRtl ? "بدون أولوية" : "No Priority",
      icon: AlertCircle,
      hex: "#6b7280",
      glow: "shadow-slate-500/20",
    };
  }
  const configKey = priority.code || priority.name?.toUpperCase() || "MEDIUM";
  const config = PRIORITY_CONFIG[configKey] || PRIORITY_CONFIG["MEDIUM"];
  return {
    label: isRtl ? priority.name : priority.nameEn || priority.name,
    icon: config.icon,
    hex: priority.color || config.fallbackColor,
    glow: config.glow,
  };
}

// ============================================================
// دالة الموقع (معدلة لقبول null)
// ============================================================
export function getFullLocation(
  workOrder?: {
    locationString?: string;
    building?: { name: string; nameEn?: string | null } | null;
    floor?: { name: string; nameEn?: string | null } | null;
    room?: { name: string; nameEn?: string | null } | null;
  },
  locale: string = "en"
): string {
  if (!workOrder) return "-";
  if (workOrder.locationString) return workOrder.locationString;

  const isRtl = locale === "ar";
  const parts: string[] = [];

  if (workOrder.building) {
    parts.push(
      isRtl
        ? workOrder.building.name
        : workOrder.building.nameEn || workOrder.building.name
    );
  }
  if (workOrder.floor) {
    parts.push(
      isRtl
        ? workOrder.floor.name
        : workOrder.floor.nameEn || workOrder.floor.name
    );
  }
  if (workOrder.room) {
    parts.push(
      isRtl
        ? workOrder.room.name
        : workOrder.room.nameEn || workOrder.room.name
    );
  }

  return parts.length ? parts.join(" - ") : "-";
}

export function getWorkOrderTypeLabel(type: string, isRtl: boolean = false): string {
  const map: Record<string, { ar: string; en: string }> = {
    MAINTENANCE: { ar: "صيانة وقائية", en: "Maintenance" },
    CORRECTIVE: { ar: "صيانة علاجية", en: "Corrective" },
    EMERGENCY: { ar: "طارئ", en: "Emergency" },
    BULK_PREVENTIVE: { ar: "صيانة شاملة", en: "Bulk Preventive" },
  };
  const entry = map[type];
  if (!entry) return type;
  return isRtl ? entry.ar : entry.en;
}

// ============================================================
// ✅ واجهة مساعدة لحساب عدد الأصول (بدون any)
// ============================================================
interface AssetCountSource {
  assetCount?: number | null;
  workOrderAssets?: unknown[] | null;
}

// ============================================================
// ✅ دالة حساب عدد الأصول (نوع آمن)
// ============================================================
export function getAssetCount(workOrder: AssetCountSource): number {
  return workOrder.assetCount ?? workOrder.workOrderAssets?.length ?? 0;
}