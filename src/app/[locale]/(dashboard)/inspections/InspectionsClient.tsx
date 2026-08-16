// src/app/[locale]/(dashboard)/inspections/InspectionsClient.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Calendar,
  MapPin,
  Trash2,
  Edit,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "@/lib/client-guard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DataList, type FilterSection, type ItemActions } from "@/components/shared/DataList";
import { useDebounce } from "@/hooks/useDebounce";
import Link from "next/link";
import type { Inspection } from "./types";

// ============================================================
// 1. تكوين الحالات
// ============================================================
const STATUS_CONFIG: Record<
  string,
  {
    label: { ar: string; en: string };
    hex: string;
    icon: LucideIcon; // ✅ استبدال any بنوع LucideIcon
    glow: string;
    bg: string;
  }
> = {
  draft: {
    label: { ar: "مسودة", en: "Draft" },
    hex: "#6b7280",
    icon: AlertCircle,
    glow: "shadow-slate-500/20",
    bg: "bg-slate-50 dark:bg-slate-800/30",
  },
  in_progress: {
    label: { ar: "قيد التنفيذ", en: "In Progress" },
    hex: "#3b82f6",
    icon: Clock,
    glow: "shadow-blue-500/20",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  completed: {
    label: { ar: "مكتمل", en: "Completed" },
    hex: "#22c55e",
    icon: CheckCircle2,
    glow: "shadow-emerald-500/20",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  approved: {
    label: { ar: "معتمد", en: "Approved" },
    hex: "#8b5cf6",
    icon: CheckCircle2,
    glow: "shadow-purple-500/20",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
};

// ============================================================
// 2. دوال مساعدة
// ============================================================
function getStatusDisplay(status: string, isRtl: boolean) {
  const config = STATUS_CONFIG[status] || {
    label: { ar: status, en: status },
    hex: "#6b7280",
    icon: AlertCircle,
    glow: "shadow-slate-500/20",
    bg: "bg-slate-50 dark:bg-slate-800/30",
  };
  const Icon = config.icon;
  return {
    label: isRtl ? config.label.ar : config.label.en,
    hex: config.hex,
    icon: Icon,
    glow: config.glow,
    bg: config.bg,
  };
}

function formatDateLocal(dateStr?: string, isRtl?: boolean): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(isRtl ? "ar-SA" : "en-US");
}

// ============================================================
// 3. الواجهات
// ============================================================
interface InspectionsClientProps {
  initialInspections: Inspection[];
  statuses: { id: string; name: string; nameEn: string }[];
  q: string;
  statusFilter: string;
  locale: string;
  pagination: {
    hasMore: boolean;
    nextUrl: string | null;
    prevUrl: string | null;
    currentCount: number;
    totalCount: number;
    startIndex: number;
    currentPage: number;
    totalPages: number;
  };
}

// ============================================================
// 4. المكون الرئيسي
// ============================================================
export default function InspectionsClient({
  initialInspections,
  statuses,
  q,
  statusFilter,
  locale,
  pagination,
}: InspectionsClientProps) {
  const router = useRouter();
  const isRtl = locale === "ar";

  // ✅ القائمة الافتراضية للحالات (بدون "all" لأننا سنضيفها يدوياً)
  const defaultStatuses = [
    { id: 'draft', name: 'مسودة', nameEn: 'Draft' },
    { id: 'in_progress', name: 'قيد التنفيذ', nameEn: 'In Progress' },
    { id: 'completed', name: 'مكتمل', nameEn: 'Completed' },
    { id: 'approved', name: 'معتمد', nameEn: 'Approved' },
  ];

  // استخدم statuses الممررة إذا كانت موجودة، وإلا استخدم القائمة الافتراضية
  const statusesList = statuses && statuses.length > 0 ? statuses : defaultStatuses;

  // حالة الفلاتر
  const [searchTerm, setSearchTerm] = useState(q);
  const [selectedStatus, setSelectedStatus] = useState(statusFilter || "all");

  const debouncedSearch = useDebounce(searchTerm, 500);

  // تحديث URL عند تغيير الفلاتر
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus);
    params.set("page", "1");
    router.push(`/${locale}/inspections?${params.toString()}`);
  }, [debouncedSearch, selectedStatus, locale, router]);

  // ===== دوال التعديل والحذف =====
  const handleDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(
      isRtl
        ? `⚠️ هل أنت متأكد من حذف الفحص "${title}"؟ لا يمكن التراجع عن هذا الإجراء.`
        : `⚠️ Are you sure you want to delete "${title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/inspections/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || (isRtl ? "فشل الحذف" : "Deletion failed"));
        return;
      }

      toast.success(isRtl ? "✅ تم حذف الفحص بنجاح" : "✅ Inspection deleted successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(isRtl ? "حدث خطأ أثناء الاتصال بالخادم" : "Server connection error");
    }
  };

  // ===== بناء الفلاتر مع ضمان عدم تكرار "all" =====
  const filterSections: FilterSection[] = useMemo(() => {
    // التأكد من أن statusesList هي مصفوفة
    const safeStatuses = Array.isArray(statusesList) ? statusesList : [];

    // استبعاد أي حالة تحمل id === "all" لتجنب التكرار مع الخيار اليدوي
    const filteredStatuses = safeStatuses.filter(s => s.id !== "all");

    // بناء خيارات الحالة: الخيار الأول هو "all" يدوياً، ثم باقي الحالات
    const statusOptions = [
      { value: "all", label: isRtl ? "جميع الحالات" : "All Statuses" },
      ...filteredStatuses.map((s) => ({
        value: s.id,
        label: isRtl ? s.name : s.nameEn,
      })),
    ];

    return [
      {
        id: "status",
        label: isRtl ? "الحالة" : "Status",
        options: statusOptions,
      },
    ];
  }, [statusesList, isRtl]);

  const filterValues = {
    status: selectedStatus,
  };

  const onFilterChange = (sectionId: string, value: string) => {
    if (sectionId === "status") setSelectedStatus(value);
  };

  // ===== عرض بطاقة الفحص =====
  const renderInspectionCard = (inspection: Inspection, actions: ItemActions) => {
    const statusInfo = getStatusDisplay(inspection.status, isRtl);
    const Icon = statusInfo.icon;
    const statusColor = statusInfo.hex;

    const progress = inspection._count?.totalItems
      ? Math.round(((inspection._count.completedItems || 0) / inspection._count.totalItems) * 100)
      : 0;

    return (
      <div
        key={inspection.id}
        onClick={() => router.push(`/${locale}/inspections/${inspection.id}`)}
        className="group relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-2xl transition-all duration-300 cursor-pointer bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 hover:bg-white/90 dark:hover:bg-slate-900/90 hover:scale-[1.01] hover:shadow-xl shadow-sm hover:shadow-indigo-500/5 dark:hover:shadow-indigo-400/5"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div
          className="relative z-10 h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
          style={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
            boxShadow: `0 0 20px ${statusColor}30`,
          }}
        >
          <Icon size={28} style={{ color: statusColor }} />
        </div>

        <div className="relative z-10 flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 truncate leading-none">
              {inspection.title}
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50/50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
              <Tag size={10} />
              #{inspection.id.slice(-6)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-indigo-400 dark:text-indigo-500" />
              <span className="font-medium">{inspection.locationName || (isRtl ? "موقع غير محدد" : "Unspecified location")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-400 dark:text-indigo-500" />
              <span className="font-medium">{formatDateLocal(inspection.scheduledDate, isRtl)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ClipboardCheck size={14} className="text-indigo-400 dark:text-indigo-500" />
              <span className="font-medium">
                {inspection._count?.totalItems || 0} {isRtl ? "بند" : "items"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 max-w-[200px] h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {progress}%
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Badge
            className={cn(
              "rounded-full text-xs font-semibold px-3 py-1.5 inline-flex items-center gap-1.5 border border-slate-200/30 dark:border-slate-700/30 shadow-sm",
              statusInfo.bg
            )}
            style={{
              color: statusColor,
              boxShadow: `0 0 15px ${statusColor}25`,
            }}
          >
            <Icon size={12} /> {statusInfo.label}
          </Badge>

          <div className="flex items-center gap-1">
          {/* عرض */}
          <Link href={`/${locale}/inspections/${inspection.id}`}>
            <button
              className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
              title={isRtl ? "عرض التفاصيل" : "View Details"}
            >
              <ChevronRight size={18} />
            </button>
          </Link>

          {/* تعديل */}
          <Link href={`/${locale}/inspections/${inspection.id}?edit=true`}>
            <button
              className="p-2 rounded-full text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all duration-200 hover:scale-110"
              title={isRtl ? "تعديل الفحص" : "Edit Inspection"}
            >
              <Edit className="h-4 w-4" />
            </button>
          </Link>

          {/* حذف */}
          <button
            onClick={() => actions.delete(inspection.id, inspection.title)}
            disabled={actions.isDeleting && actions.deletingId === inspection.id}
            className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200 hover:scale-110 disabled:opacity-50"
            title={isRtl ? "حذف الفحص" : "Delete Inspection"}
          >
            {actions.isDeleting && actions.deletingId === inspection.id ? (
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
  };

  // ===== ملخص الحالات =====
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialInspections.forEach((ins) => {
      const status = ins.status;
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [initialInspections]);

  const topStatuses = useMemo(() => {
    return statusesList
      .map((s) => ({
        ...s,
        count: statusCounts[s.id] || 0,
      }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [statusesList, statusCounts]);

  // ============================================================
  // 5. العرض النهائي
  // ============================================================
  return (
    <AdminGuard>
      <div className="relative space-y-8 p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
              <ClipboardCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {isRtl ? "الفحوصات" : "Inspections"}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isRtl
                  ? "إدارة قوائم التفتيش ومتابعة نتائج الفحص"
                  : "Manage inspection checklists and track results"}
              </p>
            </div>
          </div>
          <Link href={`/${locale}/inspections/new`}>
            <button className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200">
              {isRtl ? "فحص جديد" : "New Inspection"}
            </button>
          </Link>
        </div>

        <DataList
          searchPlaceholder={
            isRtl
              ? "بحث باسم الفحص، الموقع..."
              : "Search by inspection title, location..."
          }
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filterSections={filterSections}
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          items={initialInspections}
          total={pagination.totalCount}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={(page) => {
            const params = new URLSearchParams();
            if (searchTerm) params.set("q", searchTerm);
            if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus);
            params.set("page", String(page));
            router.push(`/${locale}/inspections?${params.toString()}`);
          }}
          renderItem={renderInspectionCard}
          emptyMessage={isRtl ? "لا توجد فحوصات لعرضها" : "No inspections to display"}
          onEdit={() => {}}  // ✅ دالة فارغة لأننا نستخدم Link
          onDelete={handleDelete}  // ✅ تمرير دالة الحذف
          itemsPerPage={10}
          showPagination={true}
          className="relative z-10"
        />

        {topStatuses.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/30 dark:border-slate-800/30 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <Sparkles size={16} className="text-indigo-400 dark:text-indigo-500" />
              <span>
                {isRtl
                  ? `إجمالي الفحوصات: ${pagination.totalCount}`
                  : `Total Inspections: ${pagination.totalCount}`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {topStatuses.map((s) => {
                const statusInfo = getStatusDisplay(s.id, isRtl);
                return (
                  <span
                    key={s.id}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-200/30 dark:border-slate-700/30",
                      statusInfo.bg
                    )}
                    style={{ color: statusInfo.hex }}
                  >
                    {React.createElement(statusInfo.icon, { size: 10 })}
                    {isRtl ? s.name : s.nameEn} {s.count}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}