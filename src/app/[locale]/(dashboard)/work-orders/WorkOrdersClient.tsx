"use client";

import React, { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Wrench, AlertCircle, MapPin, Calendar, Edit, Trash2, Loader2,
  ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertTriangle, XCircle
} from "lucide-react";
import { toast } from "sonner";
import { DataList, type ItemActions } from "@/components/shared/DataList";

// تعريف الأنواع
interface WorkOrder {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: string;
  priority: { id: string; name: string; nameEn?: string; color?: string } | null;
  status: { id: string; name: string; nameEn?: string; color?: string } | null;
  branch: { id: string; name: string; nameEn?: string } | null;
  room: {
    id: string;
    name: string;
    nameEn?: string;
    floor?: {
      name: string;
      nameEn?: string;
      building?: { name: string; nameEn?: string };
    };
  } | null;
  createdAt: string;
  asset: { id: string; name: string; code: string } | null;
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

// دوال مساعدة
function getStatusDisplay(status: WorkOrder['status'], isRtl: boolean) {
  if (!status) return { label: isRtl ? "بدون حالة" : "No status", color: "#6b7280", icon: AlertCircle, hex: "#6b7280" };
  const name = isRtl ? status.name : (status.nameEn || status.name);
  const colorHex = status.color || "#6b7280";
  let Icon = AlertCircle;
  const nameLower = name.toLowerCase();
  if (nameLower.includes("تم") || nameLower.includes("completed")) Icon = CheckCircle2;
  else if (nameLower.includes("قيد") || nameLower.includes("progress")) Icon = Clock;
  else if (nameLower.includes("ملغي") || nameLower.includes("cancelled")) Icon = XCircle;
  return { label: name, color: colorHex, icon: Icon, hex: colorHex };
}

function getPriorityDisplay(priority: WorkOrder['priority'], isRtl: boolean) {
  if (!priority) return { label: isRtl ? "بدون أولوية" : "No priority", color: "#6b7280", icon: AlertCircle, hex: "#6b7280" };
  const name = isRtl ? priority.name : (priority.nameEn || priority.name);
  const colorHex = priority.color || "#6b7280";
  let Icon = AlertCircle;
  const nameLower = name.toLowerCase();
  if (nameLower.includes("عالي") || nameLower.includes("high")) Icon = AlertTriangle;
  else if (nameLower.includes("عاجل") || nameLower.includes("emergency")) Icon = AlertCircle;
  else if (nameLower.includes("منخفض") || nameLower.includes("low")) Icon = Clock;
  return { label: name, color: colorHex, icon: Icon, hex: colorHex };
}

function getFullLocation(room: WorkOrder['room'], isRtl: boolean): string {
  if (!room) return "—";
  const floor = room.floor;
  const building = floor?.building;
  const buildingName = building ? (isRtl ? building.name : building.nameEn || building.name) : "";
  const floorName = floor ? (isRtl ? floor.name : floor.nameEn || floor.name) : "";
  const roomName = isRtl ? room.name : room.nameEn || room.name;
  const parts = [buildingName, floorName, roomName].filter(p => p);
  return parts.join(" - ");
}

export default function WorkOrdersClient({
  initialWorkOrders,
  statuses,
  priorities,
  total,
  currentPage: initialPage,
  totalPages: initialTotalPages,
  q: initialSearch,
  statusId: initialStatusId,
  priorityId: initialPriorityId,
  locale,
}: WorkOrdersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isRtl = locale === "ar";

  // حالات محلية لإدارة التفاعلات (تحديث URL يؤدي إلى إعادة جلب من الخادم)
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedStatusId, setSelectedStatusId] = useState(initialStatusId || "all");
  const [selectedPriorityId, setSelectedPriorityId] = useState(initialPriorityId || "all");
  const [currentPage, setCurrentPage] = useState(initialPage);

  // دوال لتحديث URL وإعادة التوجيه (سيؤدي إلى جلب بيانات جديدة من الخادم)
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (selectedStatusId !== "all") params.set("statusId", selectedStatusId);
    if (selectedPriorityId !== "all") params.set("priorityId", selectedPriorityId);
    if (currentPage > 1) params.set("page", currentPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }, [searchTerm, selectedStatusId, selectedPriorityId, currentPage, router, pathname]);

  // استدعاء عند تغيير أي فلتر أو صفحة
  React.useEffect(() => {
    updateUrl();
  }, [searchTerm, selectedStatusId, selectedPriorityId, currentPage]);

  const handleDelete = async (id: string, title: string) => {
    const res = await fetch(`/api/work-orders/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || (isRtl ? "فشل الحذف" : "Delete failed"));
    }
    toast.success(isRtl ? "تم حذف أمر العمل بنجاح" : "Work order deleted");
    router.refresh();
  };

  const handleEdit = (id: string) => {
    router.push(`/${locale}/work-orders/${id}/edit`);
  };

  // بناء أقسام الفلترة
  const filterSections = [
    {
      id: "statusId",
      label: isRtl ? "الحالة" : "Status",
      options: [
        { value: "all", label: isRtl ? "جميع الحالات" : "All Statuses" },
        ...statuses.map((s) => ({ value: s.id, label: isRtl ? s.name : (s.nameEn || s.name) })),
      ],
    },
    {
      id: "priorityId",
      label: isRtl ? "الأولوية" : "Priority",
      options: [
        { value: "all", label: isRtl ? "جميع الأولويات" : "All Priorities" },
        ...priorities.map((p) => ({ value: p.id, label: isRtl ? p.name : (p.nameEn || p.name) })),
      ],
    },
  ];

  // دالة عرض كل أمر عمل
  const renderWorkOrderItem = (workOrder: WorkOrder, actions: ItemActions) => {
    const statusInfo = getStatusDisplay(workOrder.status, isRtl);
    const priorityInfo = getPriorityDisplay(workOrder.priority, isRtl);
    const fullLocation = getFullLocation(workOrder.room, isRtl);

    return (
      <div
        key={workOrder.id}
        className="group flex flex-col md:flex-row items-start md:items-center gap-6 bg-card hover:bg-secondary/40 border border-border rounded-[2rem] p-5 px-8 transition-all duration-300 cursor-pointer"
        onClick={() => router.push(`/${locale}/work-orders/${workOrder.id}`)}
      >
        {/* أيقونة الحالة */}
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          style={{ backgroundColor: `${statusInfo.hex}20`, color: statusInfo.hex, boxShadow: `0 0 12px ${statusInfo.hex}80` }}
        >
          <statusInfo.icon size={24} style={{ color: statusInfo.hex }} />
        </div>

        {/* المعلومات الأساسية */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black group-hover:text-primary truncate leading-none text-foreground">
              {workOrder.title}
            </h3>
            <span className="text-[12px] font-black text-primary px-3 py-1.5 bg-primary/5 rounded-xl border border-primary/10 uppercase tracking-widest">
              {workOrder.code || `#${workOrder.id.slice(-4)}`}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-bold">
            <div className="flex items-center gap-2"><MapPin size={12} /> {fullLocation}</div>
            <div className="flex items-center gap-2"><Calendar size={12} /> {new Date(workOrder.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}</div>
          </div>
        </div>

        {/* الجانب الأيمن: الأولوية + الحالة + الأزرار */}
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
  };

  return (
    <DataList
      title={isRtl ? "أوامر العمل" : "Work Orders"}
      subtitle={isRtl ? "إدارة ومتابعة جميع طلبات الصيانة والإصلاح" : "Manage and track all maintenance and repair requests"}
      icon={<Wrench size={28} />}
      items={initialWorkOrders}
      total={total}
      currentPage={currentPage}
      totalPages={initialTotalPages}
      onPageChange={setCurrentPage}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder={isRtl ? "بحث بالعنوان أو الكود..." : "Search by title or code..."}
      filterSections={filterSections}
      filterValues={{ statusId: selectedStatusId, priorityId: selectedPriorityId }}
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
      emptyMessage={isRtl ? "لا توجد أوامر عمل لعرضها" : "No work orders to display"}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}