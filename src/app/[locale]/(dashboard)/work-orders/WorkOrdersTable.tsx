//// src/app/[locale]/(dashboard)/work-orders/components/WorkOrdersTable.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wrench,
} from "lucide-react";
import {
  getWorkOrderTypeLabel,
  getFullLocation,
  getStatusDisplay,
  getPriorityDisplay,
} from "./helpers";
import type { WorkOrder } from "./types";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";

interface WorkOrdersTableProps {
  workOrders: WorkOrder[];
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  isDeleting: boolean;
  deletingId: string | null;
  locale: string;
  isRtl: boolean;
}

export function WorkOrdersTable({
  workOrders,
  onEdit,
  onDelete,
  isDeleting,
  deletingId,
  locale,
  isRtl,
}: WorkOrdersTableProps) {
  const router = useRouter();

  if (workOrders.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        {isRtl ? "لا توجد أوامر عمل لعرضها" : "No work orders found"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workOrders.map((workOrder) => {
        const fullLocation = getFullLocation(workOrder.room, isRtl);
        const formattedDate = new Intl.DateTimeFormat(isRtl ? "ar-SA" : "en-US").format(
          new Date(workOrder.createdAt)
        );

        return (
          <div
            key={workOrder.id} // ✅ مفتاح فريد لكل عنصر
            onClick={() => router.push(`/${locale}/work-orders/${workOrder.id}`)}
            className="group relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-2xl transition-all duration-300 cursor-pointer bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 hover:bg-white/90 dark:hover:bg-slate-900/90 hover:scale-[1.01] hover:shadow-xl shadow-sm hover:shadow-indigo-500/5 dark:hover:shadow-indigo-400/5"
          >
            {/* خلفية متدرجة */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* أيقونة الحالة */}
            <div
              className="relative z-10 h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
              style={{
                backgroundColor: `${getStatusDisplay(workOrder.status, isRtl).hex}20`,
                color: getStatusDisplay(workOrder.status, isRtl).hex,
                boxShadow: `0 0 20px ${getStatusDisplay(workOrder.status, isRtl).hex}30`,
              }}
            >
              {(() => {
                const Icon = getStatusDisplay(workOrder.status, isRtl).icon;
                return <Icon size={28} style={{ color: getStatusDisplay(workOrder.status, isRtl).hex }} />;
              })()}
            </div>

            {/* البيانات الأساسية */}
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

            {/* الأولوية والحالة والإجراءات */}
            <div className="relative z-10 flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
              <PriorityBadge priority={workOrder.priority} isRtl={isRtl} />
              <StatusBadge status={workOrder.status} isRtl={isRtl} />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(workOrder.id)}
                  className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
                  title={isRtl ? "تعديل" : "Edit"}
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => onDelete(workOrder.id, workOrder.title)}
                  disabled={isDeleting && deletingId === workOrder.id}
                  className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200 hover:scale-110 disabled:opacity-50"
                >
                  {isDeleting && deletingId === workOrder.id ? (
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
      })}
    </div>
  );
}