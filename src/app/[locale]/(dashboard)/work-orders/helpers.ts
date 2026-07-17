// src/app/[locale]/(dashboard)/work-orders/helpers.ts
import { Prisma } from "@prisma/client";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  WORK_ORDER_TYPES,
} from "./constants";
import type {
  WorkOrder,
  WorkOrderType,
  PriorityCode,
  StatusCode,
} from "./types";

// ============================================================
// إعادة تصدير الأنواع والثوابت لتسهيل الاستيراد
// ============================================================

export type { WorkOrder, WorkOrderType, PriorityCode, StatusCode };
export { WORK_ORDER_TYPES, STATUS_CONFIG, PRIORITY_CONFIG };

// ============================================================
// تعريف WORK_ORDER_INCLUDE
// ============================================================

export const WORK_ORDER_INCLUDE = {
  priority: { select: { id: true, code: true, name: true, nameEn: true, color: true } },
  status: { select: { id: true, code: true, name: true, nameEn: true, color: true } },
  branch: { select: { id: true, name: true, nameEn: true } },
  room: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      floor: {
        select: {
          name: true,
          nameEn: true,
          building: {
            select: { name: true, nameEn: true },
          },
        },
      },
    },
  },
  assetType: { select: { id: true, name: true, nameEn: true } },
  workOrderAssets: {
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          code: true,
          nameEn: true,
        },
      },
    },
  },
} as const satisfies Prisma.WorkOrderInclude;

// ============================================================
// النوع WorkOrderRaw
// ============================================================

type WorkOrderRaw = Prisma.WorkOrderGetPayload<{
  include: typeof WORK_ORDER_INCLUDE;
}>;

// ============================================================
// دوال التحويل الآمنة
// ============================================================

function mapPriority(priority: NonNullable<WorkOrderRaw["priority"]>) {
  return {
    id: priority.id,
    code: priority.code as PriorityCode | undefined,
    name: priority.name,
    nameEn: priority.nameEn ?? undefined,
    color: priority.color ?? undefined,
  };
}

function mapStatus(status: NonNullable<WorkOrderRaw["status"]>) {
  return {
    id: status.id,
    code: status.code as StatusCode | undefined,
    name: status.name,
    nameEn: status.nameEn ?? undefined,
    color: status.color ?? undefined,
  };
}

function mapBranch(branch: NonNullable<WorkOrderRaw["branch"]>) {
  return {
    id: branch.id,
    name: branch.name,
    nameEn: branch.nameEn ?? undefined,
  };
}

function mapRoom(room: NonNullable<WorkOrderRaw["room"]>) {
  return {
    id: room.id,
    name: room.name,
    nameEn: room.nameEn ?? undefined,
    floor: room.floor
      ? {
          name: room.floor.name,
          nameEn: room.floor.nameEn ?? undefined,
          building: room.floor.building
            ? {
                name: room.floor.building.name,
                nameEn: room.floor.building.nameEn ?? undefined,
              }
            : undefined,
        }
      : undefined,
  };
}

function mapAssetType(assetType: NonNullable<WorkOrderRaw["assetType"]>) {
  return {
    id: assetType.id,
    name: assetType.name,
    nameEn: assetType.nameEn ?? undefined,
  };
}

export function mapWorkOrder(wo: WorkOrderRaw): WorkOrder {
  const firstAsset = wo.workOrderAssets.at(0);

  return {
    id: wo.id,
    code: wo.code ?? `WO-${wo.id.slice(-4)}`,
    title: wo.title,
    description: wo.description,
    type: wo.type,
    priority: wo.priority ? mapPriority(wo.priority) : null,
    status: wo.status ? mapStatus(wo.status) : null,
    branch: wo.branch ? mapBranch(wo.branch) : null,
    room: wo.room ? mapRoom(wo.room) : null,
    assetType: wo.assetType ? mapAssetType(wo.assetType) : null,
    asset: firstAsset
      ? {
          id: firstAsset.asset.id,
          name: firstAsset.asset.name,
          code: firstAsset.asset.code,
        }
      : null,
    createdAt: wo.createdAt.toISOString(),
    updatedAt: wo.updatedAt.toISOString(),
  };
}

// ============================================================
// دوال مساعدة للعرض
// ============================================================

export function getWorkOrderTypeLabel(type: WorkOrderType, isRtl: boolean): string {
  return isRtl ? WORK_ORDER_TYPES[type].labelAr : WORK_ORDER_TYPES[type].labelEn;
}

export function getStatusDisplay(status: WorkOrder["status"], isRtl: boolean) {
  if (!status) {
    return {
      label: isRtl ? "بدون حالة" : "No Status",
      icon: STATUS_CONFIG.PENDING.icon,
      hex: "#6b7280",
      glow: "shadow-slate-500/20",
    };
  }

  const key = status.code || "PENDING";
  const config = STATUS_CONFIG[key] || STATUS_CONFIG.PENDING;

  return {
    label: isRtl ? status.name : status.nameEn || status.name,
    icon: config.icon,
    hex: status.color || config.fallbackColor,
    glow: config.glow,
  };
}

export function getPriorityDisplay(priority: WorkOrder["priority"], isRtl: boolean) {
  if (!priority) {
    return {
      label: isRtl ? "بدون أولوية" : "No Priority",
      icon: PRIORITY_CONFIG.MEDIUM.icon,
      hex: "#6b7280",
      glow: "shadow-slate-500/20",
    };
  }

  const key = priority.code || "MEDIUM";
  const config = PRIORITY_CONFIG[key] || PRIORITY_CONFIG.MEDIUM;

  return {
    label: isRtl ? priority.name : priority.nameEn || priority.name,
    icon: config.icon,
    hex: priority.color || config.fallbackColor,
    glow: config.glow,
  };
}

export function getFullLocation(room: WorkOrder["room"], isRtl: boolean): string {
  if (!room) return "—";
  const floor = room.floor;
  const building = floor?.building;
  const parts: string[] = [];
  if (building) {
    parts.push(isRtl ? building.name : building.nameEn || building.name);
  }
  if (floor) {
    parts.push(isRtl ? floor.name : floor.nameEn || floor.name);
  }
  parts.push(isRtl ? room.name : room.nameEn || room.name);
  return parts.filter(Boolean).join(" - ");
}