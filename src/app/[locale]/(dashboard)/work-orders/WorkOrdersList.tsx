//locale]/(dashboard)/work-orders/components/WorkOrdersList.tsx
"use client";

import React, { useState, useCallback, useEffect, useTransition, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Wrench, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DataList } from "@/components/shared/DataList";
import { WorkOrdersTable } from "./WorkOrdersTable";
import type { WorkOrder } from "./types";


interface WorkOrdersListProps {
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

export function WorkOrdersList({
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
}: WorkOrdersListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isRtl = locale === "ar";
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedStatusId, setSelectedStatusId] = useState(initialStatusId || "all");
  const [selectedPriorityId, setSelectedPriorityId] = useState(initialPriorityId || "all");
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      if (!confirm(isRtl ? `هل أنت متأكد من حذف "${name}"؟` : `Are you sure you want to delete "${name}"?`)) return;

      setIsDeleting(true);
      setDeletingId(id);
      try {
        const res = await fetch(`/api/work-orders/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || (isRtl ? "فشل حذف أمر العمل" : "Failed to delete work order"));
        }
        toast.success(isRtl ? "تم حذف أمر العمل بنجاح" : "Work order deleted successfully");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : isRtl ? "حدث خطأ غير متوقع" : "Unexpected error");
      } finally {
        setIsDeleting(false);
        setDeletingId(null);
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

  const filterValues = {
    statusId: selectedStatusId,
    priorityId: selectedPriorityId,
  };

  const onFilterChange = (id: string, value: string) => {
    if (id === "statusId") setSelectedStatusId(value);
    if (id === "priorityId") setSelectedPriorityId(value);
    setCurrentPage(1);
  };

  const onReset = () => {
    setSearchTerm("");
    setSelectedStatusId("all");
    setSelectedPriorityId("all");
    setCurrentPage(1);
  };

  // =========================
  // Render
  // =========================

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
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

      {/* DataList مع إضافة key في renderItem */}
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
        renderItem={(item) => (
          <WorkOrdersTable
            key={item.id} // ✅ إضافة key هنا
            workOrders={[item]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={isDeleting}
            deletingId={deletingId}
            locale={locale}
            isRtl={isRtl}
          />
        )}
        emptyMessage={isRtl ? "لا توجد أوامر عمل لعرضها" : "No work orders found"}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showPagination={true}
        className="relative z-10"
      />

      {/* ملخص الحالات */}
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
            return (
              <span
                key={status.id}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 dark:bg-slate-800/60 border border-slate-200/30 dark:border-slate-700/30"
              >
                {isRtl ? status.name : status.nameEn || status.name} {count}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}