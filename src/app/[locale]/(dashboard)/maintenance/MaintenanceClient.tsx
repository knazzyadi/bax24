// src/app/[locale]/(dashboard)/maintenance/MaintenanceClient.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Calendar, Clock, FileText, Building, Tag, Edit, Trash2, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { DataList, type FilterSection, type ItemActions } from "@/components/shared/DataList";

// ✅ توسيع واجهة Schedule لتشمل الحقول المطلوبة لحساب nextDueDate
interface Schedule {
  id: string;
  name: string;
  frequency: string;
  frequencyDays?: number;        // قد لا يكون موجوداً في البيانات القديمة
  leadDays: number;
  isActive: boolean;
  startDate?: string | null;
  createdAt: string;             // مطلوب للحساب
  lastRunAt?: string | null;
  assetType: { id: string; name: string; nameEn?: string } | null;
  branch: { id: string; name: string; nameEn?: string } | null;
  building: { id: string; name: string; nameEn?: string } | null;
}

const FREQUENCY_LABELS: Record<string, { ar: string; en: string }> = {
  MONTHLY: { ar: "شهري", en: "Monthly" },
  QUARTERLY: { ar: "ربع سنوي", en: "Quarterly" },
  SEMI_ANNUAL: { ar: "نصف سنوي", en: "Semi-annual" },
  YEARLY: { ar: "سنوي", en: "Yearly" },
};

// دالة لحساب عدد الأيام من التردد (في حال عدم وجود frequencyDays)
const getDaysFromFrequency = (freq: string): number => {
  switch (freq) {
    case 'MONTHLY': return 30;
    case 'QUARTERLY': return 90;
    case 'SEMI_ANNUAL': return 180;
    case 'YEARLY': return 365;
    default: return 30;
  }
};

// دالة حساب تاريخ الاستحقاق القادم
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

// دالة للتحقق مما إذا كان التاريخ يقع ضمن نطاق زمني معين
const isWithinPeriod = (date: Date, period: 'today' | 'week' | 'month'): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  switch (period) {
    case 'today':
      return target.getTime() === today.getTime();
    case 'week': {
      const weekLater = new Date(today);
      weekLater.setDate(today.getDate() + 7);
      return target >= today && target <= weekLater;
    }
    case 'month': {
      const monthLater = new Date(today);
      monthLater.setDate(today.getDate() + 30);
      return target >= today && target <= monthLater;
    }
    default:
      return false;
  }
};

interface MaintenanceClientProps {
  initialSchedules: Schedule[];
  total: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  q: string;
  isActive: string;  // هذا لم يعد مستخدماً، لكن يمكن الاحتفاظ به للتوافق
  locale: string;
}

export default function MaintenanceClient({
  initialSchedules,
  total,
  currentPage: initialPage,
  totalPages: initialTotalPages,
  limit,
  q: initialSearch,
  isActive: initialStatus,
  locale,
}: MaintenanceClientProps) {
  const router = useRouter();
  const isRtl = locale === "ar";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(initialPage);

  // فلترة الجداول بناءً على فترة الاستحقاق
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
        return isWithinPeriod(nextDue, selectedPeriod as 'today' | 'week' | 'month');
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

  const handleDelete = async (id: string, name: string) => {
    const res = await fetch(`/api/maintenance/schedules/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "فشل الحذف");
    }
    toast.success(isRtl ? "تم حذف الجدول بنجاح" : "Schedule deleted");
    router.refresh();
  };

  // ✅ فلتر زمني جديد
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

  const renderScheduleItem = (schedule: Schedule, actions: ItemActions) => {
    const frequencyLabel = FREQUENCY_LABELS[schedule.frequency]?.[isRtl ? "ar" : "en"] || schedule.frequency;
    const assetTypeName = schedule.assetType ? (isRtl ? schedule.assetType.name : schedule.assetType.nameEn || schedule.assetType.name) : "—";
    const locationName = schedule.building?.name || schedule.branch?.name || (isRtl ? "جميع المواقع" : "All locations");
    const nextDue = getNextDueDate(schedule);
    const formattedNextDue = nextDue ? nextDue.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : '—';

    return (
      <div
        key={schedule.id}
        className="group flex flex-col md:flex-row items-start md:items-center gap-6 bg-card hover:bg-secondary/40 border border-border rounded-[2rem] p-5 px-8 transition-all duration-300 cursor-pointer"
        onClick={() => router.push(`/${locale}/maintenance/${schedule.id}`)}
      >
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 bg-primary/10 text-primary">
          <Calendar size={24} />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-medium group-hover:text-primary truncate leading-none">{schedule.name}</h3>
            {!schedule.isActive && (
              <span className="text-xs bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                {isRtl ? "غير نشط" : "Inactive"}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-medium">
            <div className="flex items-center gap-2"><Clock size={12} /> {frequencyLabel}</div>
            <div className="flex items-center gap-2"><Tag size={12} /> {assetTypeName}</div>
            <div className="flex items-center gap-2"><Building size={12} /> {locationName}</div>
            <div className="flex items-center gap-2"><Calendar size={12} /> {isRtl ? "قادم:" : "Next:"} {formattedNextDue}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <button
              onClick={() => actions.edit(schedule.id)}
              className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 hover:scale-110"
              title={isRtl ? "تعديل" : "Edit"}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => actions.delete(schedule.id, schedule.name)}
              disabled={actions.isDeleting && actions.deletingId === schedule.id}
              className="p-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200 hover:scale-110 disabled:opacity-50"
            >
              {actions.isDeleting && actions.deletingId === schedule.id ? (
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
  };

  return (
    <DataList
      title={isRtl ? "جداول الصيانة الوقائية" : "Preventive Maintenance Schedules"}
      subtitle={isRtl ? "إدارة الجداول الدورية للصيانة وإنشاء أوامر العمل تلقائياً" : "Manage recurring maintenance schedules and auto-generate work orders"}
      icon={<Calendar size={28} />}
      addButtonLabel={isRtl ? "إضافة جدول جديد" : "New Schedule"}
      addButtonLink={`/${locale}/maintenance/new`}
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
    />
  );
}