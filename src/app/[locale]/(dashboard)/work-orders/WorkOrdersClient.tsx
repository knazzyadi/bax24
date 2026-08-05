// src/app/[locale]/(dashboard)/work-orders/WorkOrdersClient.tsx
"use client";

import {
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
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { DataList, type ItemActions } from "@/components/shared/DataList";

// =========================
// Types - Updated to match new data structure
// =========================

type WorkOrderType = "MAINTENANCE" | "CORRECTIVE" | "EMERGENCY" | "BULK_PREVENTIVE";
type StatusCode = "COMPLETED" | "IN_PROGRESS" | "CANCELLED" | "PENDING";
type PriorityCode = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";

// ✅ Updated WorkOrder interface with direct location fields
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
  building: {
    id: string;
    name: string;
    nameEn?: string;
  } | null;
  floor: {
    id: string;
    name: string;
    nameEn?: string;
  } | null;
  room: {
    id: string;
    name: string;
    nameEn?: string;
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
  statuses: { id: string; name: string; nameEn?: string; code?: string }[];
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

const STATUS_CONFIG: Record<string, { icon: LucideIcon; fallbackColor: string; glow: string }> = {
  COMPLETED: { icon: CheckCircle2, fallbackColor: "#22c55e", glow: "shadow-emerald-500/20" },
  IN_PROGRESS: { icon: Clock, fallbackColor: "#3b82f6", glow: "shadow-blue-500/20" },
  CANCELLED: { icon: XCircle, fallbackColor: "#ef4444", glow: "shadow-rose-500/20" },
  PENDING: { icon: AlertCircle, fallbackColor: "#f59e0b", glow: "shadow-amber-500/20" },
};

const PRIORITY_CONFIG: Record<string, { icon: LucideIcon; fallbackColor: string; glow: string }> = {
  LOW: { icon: Clock, fallbackColor: "#22c55e", glow: "shadow-emerald-500/20" },
  MEDIUM: { icon: AlertCircle, fallbackColor: "#3b82f6", glow: "shadow-blue-500/20" },
  HIGH: { icon: AlertTriangle, fallbackColor: "#f59e0b", glow: "shadow-amber-500/20" },
  EMERGENCY: { icon: AlertCircle, fallbackColor: "#ef4444", glow: "shadow-rose-500/20" },
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
      glow: "shadow-slate-500/20",
    };
  }
  const config = STATUS_CONFIG[status.code || "PENDING"];
  return {
    label: isRtl ? status.name : status.nameEn || status.name,
    icon: config?.icon || AlertCircle,
    hex: status.color || config?.fallbackColor || "#6b7280",
    glow: config?.glow || "shadow-slate-500/20",
  };
}

function getPriorityDisplay(priority: WorkOrder["priority"], isRtl: boolean) {
  if (!priority) {
    return {
      label: isRtl ? "بدون أولوية" : "No Priority",
      icon: AlertCircle,
      hex: "#6b7280",
      glow: "shadow-slate-500/20",
    };
  }
  const config = PRIORITY_CONFIG[priority.code || "MEDIUM"];
  return {
    label: isRtl ? priority.name : priority.nameEn || priority.name,
    icon: config?.icon || AlertCircle,
    hex: priority.color || config?.fallbackColor || "#6b7280",
    glow: config?.glow || "shadow-slate-500/20",
  };
}

// ✅ Updated getFullLocation using direct fields
function getFullLocation(workOrder: WorkOrder | null, isRtl: boolean): string {
  if (!workOrder) return "—";
  const parts: string[] = [];
  if (workOrder.building) {
    parts.push(isRtl ? workOrder.building.name : workOrder.building.nameEn || workOrder.building.name);
  }
  if (workOrder.floor) {
    parts.push(isRtl ? workOrder.floor.name : workOrder.floor.nameEn || workOrder.floor.name);
  }
  if (workOrder.room) {
    parts.push(isRtl ? workOrder.room.name : workOrder.room.nameEn || workOrder.room.name);
  }
  return parts.filter(Boolean).join(" - ") || "—";
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
  const [, startTransition] = useTransition();

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
  }, [searchTerm, selectedStatusId, selectedPriorityId, currentPage, pathname, router, startTransition]);

  // =========================
  // Actions
  // =========================

  // ✅ حذف `name` من المعاملات
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/work-orders/${id}`, { method: "DELETE" });
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

  const filterValues = useMemo(
    () => ({
      statusId: selectedStatusId,
      priorityId: selectedPriorityId,
    }),
    [selectedStatusId, selectedPriorityId]
  );

  const onFilterChange = useCallback((id: string, value: string) => {
    if (id === "statusId") setSelectedStatusId(value);
    if (id === "priorityId") setSelectedPriorityId(value);
    setCurrentPage(1);
  }, []);

  const onReset = useCallback(() => {
    setSearchTerm("");
    setSelectedStatusId("all");
    setSelectedPriorityId("all");
    setCurrentPage(1);
  }, []);

  // =========================
  // Render Item
  // =========================

  const renderWorkOrderItem = useCallback(
    (workOrder: WorkOrder, actions: ItemActions) => {
      const statusInfo = getStatusDisplay(workOrder.status, isRtl);
      const priorityInfo = getPriorityDisplay(workOrder.priority, isRtl);
      const fullLocation = getFullLocation(workOrder, isRtl);
      const formattedDate = new Intl.DateTimeFormat(isRtl ? "ar-SA" : "en-US").format(
        new Date(workOrder.createdAt)
      );

      return (
        <div
          key={workOrder.id}
          onClick={() => router.push(`/${locale}/work-orders/${workOrder.id}`)}
          className="group relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-2xl transition-all duration-300 cursor-pointer bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 hover:bg-white/90 dark:hover:bg-slate-900/90 hover:scale-[1.01] hover:shadow-xl shadow-sm hover:shadow-indigo-500/5 dark:hover:shadow-indigo-400/5"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div
            className="relative z-10 h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
            style={{
              backgroundColor: `${statusInfo.hex}20`,
              color: statusInfo.hex,
              boxShadow: `0 0 20px ${statusInfo.hex}30`,
            }}
          >
            <statusInfo.icon size={28} style={{ color: statusInfo.hex }} />
          </div>

          <div className="relative z-10 flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 truncate leading-none">
                {workOrder.title}
              </h3>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                {workOrder.code || `#${workOrder.id.slice(-4)}`}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50/50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                {getWorkOrderTypeLabel(workOrder.type, isRtl)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-indigo-400 dark:text-indigo-500" />
                <span className="font-medium">{fullLocation}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-400 dark:text-indigo-500" />
                <span className="font-medium">{formattedDate}</span>
              </div>
              {workOrder.asset && (
                <div className="flex items-center gap-1.5">
                  <Wrench size={14} className="text-indigo-400 dark:text-indigo-500" />
                  <span className="font-medium">{workOrder.asset.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span
              className="rounded-full text-xs font-semibold px-3 py-1.5 inline-flex items-center gap-1.5 border border-slate-200/30 dark:border-slate-700/30 shadow-sm"
              style={{
                backgroundColor: `${priorityInfo.hex}20`,
                color: priorityInfo.hex,
                boxShadow: `0 0 15px ${priorityInfo.hex}25`,
              }}
            >
              <priorityInfo.icon size={12} /> {priorityInfo.label}
            </span>
            <span
              className="rounded-full text-xs font-semibold px-3 py-1.5 inline-flex items-center gap-1.5 border border-slate-200/30 dark:border-slate-700/30 shadow-sm"
              style={{
                backgroundColor: `${statusInfo.hex}20`,
                color: statusInfo.hex,
                boxShadow: `0 0 15px ${statusInfo.hex}25`,
              }}
            >
              <statusInfo.icon size={12} /> {statusInfo.label}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => actions.edit(workOrder.id)}
                className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
                title={isRtl ? "تعديل" : "Edit"}
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => actions.delete(workOrder.id, workOrder.title)}
                disabled={actions.isDeleting && actions.deletingId === workOrder.id}
                className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200 hover:scale-110 disabled:opacity-50"
              >
                {actions.isDeleting && actions.deletingId === workOrder.id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </div>

            <div className="shrink-0 text-slate-300 dark:text-slate-700 group-hover:text-indigo-400 dark:group-hover:text-indigo-500 transition-all duration-300 group-hover:translate-x-1">
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
    <div className="relative space-y-8 p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Wrench className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {isRtl ? "أوامر العمل" : "Work Orders"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRtl
                ? "إدارة ومتابعة جميع طلبات الصيانة والإصلاح"
                : "Manage and track all maintenance requests"}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/${locale}/work-orders/new`)}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
        >
          {isRtl ? "إنشاء أمر عمل جديد" : "New Work Order"}
        </button>
      </div>

      <DataList
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={
          isRtl
            ? "بحث بالعنوان، الكود، أو الموقع..."
            : "Search by title, code, or location..."
        }
        filterSections={filterSections}
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        onReset={onReset}
        items={initialWorkOrders}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        renderItem={renderWorkOrderItem}
        emptyMessage={isRtl ? "لا توجد أوامر عمل لعرضها" : "No work orders found"}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showPagination={true}
        className="relative z-10"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/30 dark:border-slate-800/30 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <Sparkles size={16} className="text-indigo-400 dark:text-indigo-500" />
          <span>
            {isRtl
              ? `إجمالي أوامر العمل: ${total}`
              : `Total Work Orders: ${total}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((status) => {
            const count = initialWorkOrders.filter(
              (wo) => wo.status?.id === status.id
            ).length;
            if (count === 0) return null;
            const config = STATUS_CONFIG[status.code || "PENDING"];
            return (
              <span
                key={status.id}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 dark:bg-slate-800/60 border border-slate-200/30 dark:border-slate-700/30"
                style={{ color: config?.fallbackColor || "#6b7280" }}
              >
                {config?.icon ? <config.icon size={10} /> : null}
                {count}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}