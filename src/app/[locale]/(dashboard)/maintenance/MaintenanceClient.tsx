// src/app/[locale]/(dashboard)/maintenance/MaintenanceClient.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Building,
  Tag,
  Edit,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { DataList, type FilterSection, type ItemActions } from "@/components/shared/DataList";
import { cn } from "@/lib/utils";

// ✅ توسيع واجهة Schedule
interface Schedule {
  id: string;
  name: string;
  frequency: string;
  frequencyDays?: number;
  leadDays: number;
  isActive: boolean;
  startDate?: string | null;
  createdAt: string;
  lastRunAt?: string | null;
  assetType: { id: string; name: string; nameEn?: string } | null;
  branch: { id: string; name: string; nameEn?: string } | null;
  building: { id: string; name: string; nameEn?: string } | null;
}

const FREQUENCY_LABELS: Record<
  string,
  {
    ar: string;
    en: string;
    icon: LucideIcon;
    color: string;
  }
> = {
  MONTHLY: {
    ar: "شهري",
    en: "Monthly",
    icon: Calendar,
    color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
  },
  QUARTERLY: {
    ar: "ربع سنوي",
    en: "Quarterly",
    icon: Calendar,
    color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
  },
  SEMI_ANNUAL: {
    ar: "نصف سنوي",
    en: "Semi-annual",
    icon: Calendar,
    color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
  },
  YEARLY: {
    ar: "سنوي",
    en: "Yearly",
    icon: Calendar,
    color: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
  },
};

const getDaysFromFrequency = (freq: string): number => {
  switch (freq) {
    case "MONTHLY":
      return 30;
    case "QUARTERLY":
      return 90;
    case "SEMI_ANNUAL":
      return 180;
    case "YEARLY":
      return 365;
    default:
      return 30;
  }
};

const getNextDueDate = (schedule: Schedule): Date | null => {
  const lastRun = schedule.lastRunAt ? new Date(schedule.lastRunAt) : null;
  const start = schedule.startDate ? new Date(schedule.startDate) : null;
  const createdAt = new Date(schedule.createdAt);
  const reference = lastRun || start || createdAt;
  const days = schedule.frequencyDays || getDaysFromFrequency(schedule.frequency);
  const next = new Date(reference);
  next.setDate(next.getDate() + days);
  return next;
};

const isWithinPeriod = (date: Date, period: "today" | "week" | "month"): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  switch (period) {
    case "today":
      return target.getTime() === today.getTime();
    case "week": {
      const weekLater = new Date(today);
      weekLater.setDate(today.getDate() + 7);
      return target >= today && target <= weekLater;
    }
    case "month": {
      const monthLater = new Date(today);
      monthLater.setDate(today.getDate() + 30);
      return target >= today && target <= monthLater;
    }
    default:
      return false;
  }
};

// ✅ دالة getFrequencyDisplay مع تحسين النوع
function getFrequencyDisplay(frequency: string, isRtl: boolean) {
  const config =
    FREQUENCY_LABELS[frequency] || {
      ar: frequency,
      en: frequency,
      icon: Calendar as LucideIcon,
      color: "text-slate-500 bg-slate-50 dark:bg-slate-800/30",
    };
  return {
    label: isRtl ? config.ar : config.en,
    icon: config.icon,
    color: config.color,
  };
}

// ========== الواجهة المعدلة ==========
interface MaintenanceClientProps {
  initialSchedules: Schedule[];
  currentPage: number;
  limit: number;
  q: string;
  locale: string;
}

export default function MaintenanceClient({
  initialSchedules,
  currentPage: initialPage,
  limit,
  q: initialSearch,
  locale,
}: MaintenanceClientProps) {
  const router = useRouter();
  const isRtl = locale === "ar";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(initialPage);

  const filteredSchedules = useMemo(() => {
    let result = [...initialSchedules];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(term));
    }
    if (selectedPeriod !== "all") {
      result = result.filter((schedule) => {
        const nextDue = getNextDueDate(schedule);
        if (!nextDue) return false;
        return isWithinPeriod(nextDue, selectedPeriod as "today" | "week" | "month");
      });
    }
    return result;
  }, [initialSchedules, searchTerm, selectedPeriod]);

  const totalFiltered = filteredSchedules.length;
  const totalFilteredPages = Math.ceil(totalFiltered / limit);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  const handleEdit = (id: string) => {
    router.push(`/${locale}/maintenance/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/maintenance/schedules/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "فشل الحذف");
    }
    toast.success(isRtl ? "تم حذف الجدول بنجاح" : "Schedule deleted");
    router.refresh();
  };

  const filterSections: FilterSection[] = [
    {
      id: "period",
      label: isRtl ? "الاستحقاق" : "Due period",
      options: [
        { value: "all", label: isRtl ? "الكل" : "All" },
        { value: "today", label: isRtl ? "صيانات اليوم" : "Today's schedules" },
        { value: "week", label: isRtl ? "صيانات هذا الأسبوع" : "This week" },
        { value: "month", label: isRtl ? "صيانات هذا الشهر" : "This month" },
      ],
    },
  ];

  const filterValues = { period: selectedPeriod };
  const onFilterChange = (sectionId: string, value: string) => {
    if (sectionId === "period") {
      setSelectedPeriod(value);
      setCurrentPage(1);
    }
  };

  const statusCounts = useMemo(() => {
    const counts = { active: 0, inactive: 0, upcoming: 0 };
    initialSchedules.forEach((s) => {
      if (s.isActive) counts.active++;
      else counts.inactive++;
      const nextDue = getNextDueDate(s);
      if (nextDue && isWithinPeriod(nextDue, "week")) counts.upcoming++;
    });
    return counts;
  }, [initialSchedules]);

  const renderScheduleItem = (schedule: Schedule, actions: ItemActions) => {
    const freqDisplay = getFrequencyDisplay(schedule.frequency, isRtl);
    const FreqIcon = freqDisplay.icon;
    const assetTypeName = schedule.assetType
      ? isRtl
        ? schedule.assetType.name
        : schedule.assetType.nameEn || schedule.assetType.name
      : "—";
    const locationName =
      schedule.building?.name || schedule.branch?.name || (isRtl ? "جميع المواقع" : "All locations");
    const nextDue = getNextDueDate(schedule);
    const formattedNextDue = nextDue
      ? nextDue.toLocaleDateString(isRtl ? "ar-SA" : "en-US")
      : "—";

    const isOverdue = nextDue && nextDue < new Date();

    return (
      <div
        key={schedule.id}
        onClick={() => router.push(`/${locale}/maintenance/${schedule.id}`)}
        className="group relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-2xl transition-all duration-300 cursor-pointer bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 hover:bg-white/90 dark:hover:bg-slate-900/90 hover:scale-[1.01] hover:shadow-xl shadow-sm hover:shadow-indigo-500/5 dark:hover:shadow-indigo-400/5"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div
          className={cn(
            "relative z-10 h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
            freqDisplay.color
          )}
        >
          <FreqIcon size={28} className={freqDisplay.color.split(" ")[0]} />
        </div>

        <div className="relative z-10 flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 truncate leading-none">
              {schedule.name}
            </h3>
            {schedule.isActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50/50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isRtl ? "نشط" : "Active"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                {isRtl ? "غير نشط" : "Inactive"}
              </span>
            )}
            {isOverdue && schedule.isActive && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50/50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50">
                {isRtl ? "متأخر" : "Overdue"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-indigo-400 dark:text-indigo-500" />
              <span className="font-medium">{freqDisplay.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tag size={14} className="text-indigo-400 dark:text-indigo-500" />
              <span className="font-medium">{assetTypeName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building size={14} className="text-indigo-400 dark:text-indigo-500" />
              <span className="font-medium">{locationName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-400 dark:text-indigo-500" />
              <span className="font-medium">
                {isRtl ? "قادم:" : "Next:"} {formattedNextDue}
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <span
            className="rounded-full text-xs font-semibold px-3 py-1.5 inline-flex items-center gap-1.5 border border-slate-200/30 dark:border-slate-700/30 shadow-sm"
            style={{
              backgroundColor: isOverdue && schedule.isActive ? "#ef444420" : "#3b82f620",
              color: isOverdue && schedule.isActive ? "#ef4444" : "#3b82f6",
              boxShadow: isOverdue && schedule.isActive
                ? "0 0 15px #ef444425"
                : "0 0 15px #3b82f625",
            }}
          >
            <Calendar size={12} />
            {isRtl ? "الاستحقاق" : "Due"}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => actions.edit(schedule.id)}
              className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
              title={isRtl ? "تعديل" : "Edit"}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => actions.delete(schedule.id, schedule.name)}
              disabled={actions.isDeleting && actions.deletingId === schedule.id}
              className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200 hover:scale-110 disabled:opacity-50"
            >
              {actions.isDeleting && actions.deletingId === schedule.id ? (
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
              {isRtl ? "جداول الصيانة الوقائية" : "Preventive Maintenance Schedules"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRtl
                ? "إدارة الجداول الدورية للصيانة وإنشاء أوامر العمل تلقائياً"
                : "Manage recurring maintenance schedules and auto-generate work orders"}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/${locale}/maintenance/new`)}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
        >
          {isRtl ? "إضافة جدول جديد" : "New Schedule"}
        </button>
      </div>

      <DataList
        searchPlaceholder={isRtl ? "بحث باسم الجدول..." : "Search by schedule name..."}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterSections={filterSections}
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        items={paginatedSchedules}
        total={totalFiltered}
        currentPage={currentPage}
        totalPages={totalFilteredPages}
        onPageChange={setCurrentPage}
        renderItem={renderScheduleItem}
        emptyMessage={isRtl ? "لا توجد جداول صيانة" : "No maintenance schedules"}
        onEdit={handleEdit}
        onDelete={handleDelete}
        itemsPerPage={limit}
        showPagination={true}
        className="relative z-10"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/30 dark:border-slate-800/30 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <Sparkles size={16} className="text-indigo-400 dark:text-indigo-500" />
          <span>
            {isRtl
              ? `إجمالي الجداول: ${initialSchedules.length}`
              : `Total Schedules: ${initialSchedules.length}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50/50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {isRtl ? "نشط" : "Active"} {statusCounts.active}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
            {isRtl ? "غير نشط" : "Inactive"} {statusCounts.inactive}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50/50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
            <Calendar size={10} />
            {isRtl ? "قادم هذا الأسبوع" : "Upcoming week"} {statusCounts.upcoming}
          </span>
        </div>
      </div>
    </div>
  );
}