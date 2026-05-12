"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useTransition,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Wrench,
  AlertCircle,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { DataList, type ItemActions } from "@/components/shared/DataList";

// =========================
// Types
// =========================

type WorkOrderType = "MAINTENANCE" | "CORRECTIVE" | "EMERGENCY" | "BULK_PREVENTIVE";
type StatusCode = "COMPLETED" | "IN_PROGRESS" | "CANCELLED" | "PENDING";
type PriorityCode = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";

interface WorkOrder {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: WorkOrderType;
  priority: {
    id: string;
    code?: PriorityCode;
    name: string;
    nameEn?: string;
    color?: string;
  } | null;
  status: {
    id: string;
    code?: StatusCode;
    name: string;
    nameEn?: string;
    color?: string;
  } | null;
  branch: {
    id: string;
    name: string;
    nameEn?: string;
  } | null;
  room: {
    id: string;
    name: string;
    nameEn?: string;
    floor?: {
      name: string;
      nameEn?: string;
      building?: {
        name: string;
        nameEn?: string;
      };
    };
  } | null;
  createdAt: string;
  asset: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface WorkOrdersClientProps {
  initialWorkOrders: WorkOrder[];
  statuses: { id: string; name: string; nameEn?: string }[];
  priorities: { id: string; name: string; nameEn?: string }[];
  total: number;
  currentPage: number;
  totalPages: number;
  q: string;
  statusId: string;
  priorityId: string;
  locale: string;
}

// =========================
// Constants
// =========================

const WORK_ORDER_TYPES: Record<WorkOrderType, { ar: string; en: string }> = {
  MAINTENANCE: { ar: "صيانة", en: "Maintenance" },
  CORRECTIVE: { ar: "تصحيحية", en: "Corrective" },
  EMERGENCY: { ar: "طارئة", en: "Emergency" },
  BULK_PREVENTIVE: { ar: "وقائية شاملة", en: "Bulk Preventive" },
};

const STATUS_CONFIG: Record<string, { icon: LucideIcon; fallbackColor: string }> = {
  COMPLETED: { icon: CheckCircle2, fallbackColor: "#22c55e" },
  IN_PROGRESS: { icon: Clock, fallbackColor: "#3b82f6" },
  CANCELLED: { icon: XCircle, fallbackColor: "#ef4444" },
  PENDING: { icon: AlertCircle, fallbackColor: "#f59e0b" },
};

const PRIORITY_CONFIG: Record<string, { icon: LucideIcon; fallbackColor: string }> = {
  LOW: { icon: Clock, fallbackColor: "#22c55e" },
  MEDIUM: { icon: AlertCircle, fallbackColor: "#3b82f6" },
  HIGH: { icon: AlertTriangle, fallbackColor: "#f59e0b" },
  EMERGENCY: { icon: AlertCircle, fallbackColor: "#ef4444" },
};

// =========================
// Helper Functions
// =========================

function getWorkOrderTypeLabel(type: WorkOrderType, isRtl: boolean): string {
  return isRtl ? WORK_ORDER_TYPES[type].ar : WORK_ORDER_TYPES[type].en;
}

function getStatusDisplay(status: WorkOrder["status"], isRtl: boolean) {
  if (!status) {
    return {
      label: isRtl ? "بدون حالة" : "No Status",
      icon: AlertCircle,
      hex: "#6b7280",
    };
  }
  const config = STATUS_CONFIG[status.code || "PENDING"];
  return {
    label: isRtl ? status.name : status.nameEn || status.name,
    icon: config?.icon || AlertCircle,
    hex: status.color || config?.fallbackColor || "#6b7280",
  };
}

function getPriorityDisplay(priority: WorkOrder["priority"], isRtl: boolean) {
  if (!priority) {
    return {
      label: isRtl ? "بدون أولوية" : "No Priority",
      icon: AlertCircle,
      hex: "#6b7280",
    };
  }
  const config = PRIORITY_CONFIG[priority.code || "MEDIUM"];
  return {
    label: isRtl ? priority.name : priority.nameEn || priority.name,
    icon: config?.icon || AlertCircle,
    hex: priority.color || config?.fallbackColor || "#6b7280",
  };
}

function getFullLocation(room: WorkOrder["room"], isRtl: boolean): string {
  if (!room) return "—";
  const floor = room.floor;
  const building = floor?.building;
  const buildingName = building
    ? isRtl
      ? building.name
      : building.nameEn || building.name
    : "";
  const floorName = floor
    ? isRtl
      ? floor.name
      : floor.nameEn || floor.name
    : "";
  const roomName = isRtl ? room.name : room.nameEn || room.name;
  return [buildingName, floorName, roomName].filter(Boolean).join(" - ");
}

// =========================
// Main Component
// =========================

export default function WorkOrdersClient({
  initialWorkOrders,
  statuses,
  priorities,
  total,
  currentPage: initialPage,
  totalPages,
  q: initialSearch,
  statusId: initialStatusId,
  priorityId: initialPriorityId,
  locale,
}: WorkOrdersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isRtl = locale === "ar";
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedStatusId, setSelectedStatusId] = useState(initialStatusId || "all");
  const [selectedPriorityId, setSelectedPriorityId] = useState(initialPriorityId || "all");
  const [currentPage, setCurrentPage] = useState(initialPage);

  // =========================
  // URL Sync (Debounced)
  // =========================

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("q", searchTerm);
      if (selectedStatusId !== "all") params.set("statusId", selectedStatusId);
      if (selectedPriorityId !== "all") params.set("priorityId", selectedPriorityId);
      if (currentPage > 1) params.set("page", currentPage.toString());

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchTerm, selectedStatusId, selectedPriorityId, currentPage, pathname, router]);

  // =========================
  // Actions
  // =========================

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      const controller = new AbortController();
      try {
        const res = await fetch(`/api/work-orders/${id}`, {
          method: "DELETE",
          signal: controller.signal,
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || (isRtl ? "فشل حذف أمر العمل" : "Failed to delete work order"));
        }
        toast.success(isRtl ? "تم حذف أمر العمل بنجاح" : "Work order deleted successfully");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : isRtl ? "حدث خطأ غير متوقع" : "Unexpected error");
      }
    },
    [isRtl, router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/${locale}/work-orders/${id}/edit`);
    },
    [router, locale]
  );

  // =========================
  // Filters
  // =========================

  const filterSections = useMemo(
    () => [
      {
        id: "statusId",
        label: isRtl ? "الحالة" : "Status",
        options: [
          { value: "all", label: isRtl ? "جميع الحالات" : "All Statuses" },
          ...statuses.map((status) => ({
            value: status.id,
            label: isRtl ? status.name : status.nameEn || status.name,
          })),
        ],
      },
      {
        id: "priorityId",
        label: isRtl ? "الأولوية" : "Priority",
        options: [
          { value: "all", label: isRtl ? "جميع الأولويات" : "All Priorities" },
          ...priorities.map((priority) => ({
            value: priority.id,
            label: isRtl ? priority.name : priority.nameEn || priority.name,
          })),
        ],
      },
    ],
    [isRtl, statuses, priorities]
  );

  // =========================
  // Render Item
  // =========================

  const renderWorkOrderItem = useCallback(
    (workOrder: WorkOrder, actions: ItemActions) => {
      const statusInfo = getStatusDisplay(workOrder.status, isRtl);
      const priorityInfo = getPriorityDisplay(workOrder.priority, isRtl);
      const fullLocation = getFullLocation(workOrder.room, isRtl);
      const formattedDate = new Intl.DateTimeFormat(isRtl ? "ar-SA" : "en-US").format(new Date(workOrder.createdAt));

      return (
        <div
          key={workOrder.id}
          onClick={() => router.push(`/${locale}/work-orders/${workOrder.id}`)}
          className="group flex flex-col md:flex-row items-start md:items-center gap-6 bg-card hover:bg-secondary/40 border border-border rounded-[2rem] p-5 px-8 transition-all duration-300 cursor-pointer"
        >
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{
              backgroundColor: `${statusInfo.hex}20`,
              color: statusInfo.hex,
              boxShadow: `0 0 12px ${statusInfo.hex}80`,
            }}
          >
            <statusInfo.icon size={24} style={{ color: statusInfo.hex }} />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black truncate text-foreground group-hover:text-primary">
                {workOrder.title}
              </h3>
              <span className="text-[12px] font-black text-primary px-3 py-1.5 bg-primary/5 rounded-xl border border-primary/10 uppercase tracking-widest">
                {workOrder.code || `#${workOrder.id.slice(-4)}`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-bold">
              <div className="flex items-center gap-2">
                <MapPin size={12} /> {fullLocation}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={12} /> {formattedDate}
              </div>
              <div className="flex items-center gap-2">
                <Wrench size={12} /> {getWorkOrderTypeLabel(workOrder.type, isRtl)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span
              className="rounded-full font-black text-xs px-3 py-1.5 inline-flex items-center gap-1"
              style={{ backgroundColor: `${priorityInfo.hex}20`, color: priorityInfo.hex }}
            >
              <priorityInfo.icon size={12} /> {priorityInfo.label}
            </span>
            <span
              className="rounded-full font-black text-xs px-3 py-1.5 inline-flex items-center gap-1"
              style={{ backgroundColor: `${statusInfo.hex}20`, color: statusInfo.hex }}
            >
              <statusInfo.icon size={12} /> {statusInfo.label}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => actions.edit(workOrder.id)}
                className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 hover:scale-110"
                title={isRtl ? "تعديل" : "Edit"}
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => actions.delete(workOrder.id, workOrder.title)}
                disabled={actions.isDeleting && actions.deletingId === workOrder.id}
                className="p-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200 hover:scale-110 disabled:opacity-50"
              >
                {actions.isDeleting && actions.deletingId === workOrder.id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </div>

            <div className="shrink-0 opacity-20 group-hover:opacity-100 transition-all">
              {isRtl ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </div>
          </div>
        </div>
      );
    },
    [isRtl, locale, router]
  );

  // =========================
  // Render
  // =========================

  return (
    <DataList
      title={isRtl ? "أوامر العمل" : "Work Orders"}
      subtitle={isRtl ? "إدارة ومتابعة جميع طلبات الصيانة والإصلاح" : "Manage and track all maintenance requests"}
      icon={<Wrench size={28} />}
      items={initialWorkOrders}
      total={total}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder={isRtl ? "بحث بالعنوان أو الكود..." : "Search by title or code..."}
      filterSections={filterSections}
      filterValues={{
        statusId: selectedStatusId,
        priorityId: selectedPriorityId,
      }}
      onFilterChange={(id, value) => {
        if (id === "statusId") setSelectedStatusId(value);
        if (id === "priorityId") setSelectedPriorityId(value);
        setCurrentPage(1);
      }}
      onReset={() => {
        setSearchTerm("");
        setSelectedStatusId("all");
        setSelectedPriorityId("all");
        setCurrentPage(1);
      }}
      addButtonLabel={isRtl ? "إنشاء أمر عمل جديد" : "New Work Order"}
      addButtonLink={`/${locale}/work-orders/new`}
      renderItem={renderWorkOrderItem}
      emptyMessage={isRtl ? "لا توجد أوامر عمل لعرضها" : "No work orders found"}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}