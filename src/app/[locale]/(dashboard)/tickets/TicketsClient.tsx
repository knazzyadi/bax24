// src/app/[locale]/(dashboard)/tickets/TicketsClient.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ShieldCheck,
  AlertCircle,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { DataList, type FilterSection, type ItemActions } from "@/components/shared/DataList";
import { cn } from "@/lib/utils";
import type { Ticket } from "./types";

// =========================
// تكوين الحالات
// =========================
const STATUS_CONFIG: Record<
  string,
  { label: { ar: string; en: string }; hex: string; icon: any; glow: string }
> = {
  PENDING: {
    label: { ar: "معلق", en: "Pending" },
    hex: "#f59e0b",
    icon: Clock,
    glow: "shadow-amber-500/20",
  },
  APPROVED: {
    label: { ar: "مقبول", en: "Approved" },
    hex: "#10b981",
    icon: CheckCircle2,
    glow: "shadow-emerald-500/20",
  },
  REJECTED: {
    label: { ar: "مرفوض", en: "Rejected" },
    hex: "#ef4444",
    icon: XCircle,
    glow: "shadow-rose-500/20",
  },
};

// =========================
// دوال مساعدة
// =========================
function getStatusDisplay(status: string, isRtl: boolean) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return {
    label: isRtl ? config.label.ar : config.label.en,
    hex: config.hex,
    icon: config.icon,
    glow: config.glow,
  };
}

function getFullLocation(room: any, isRtl: boolean): string {
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
// Props
// =========================
interface TicketsClientProps {
  initialTickets: Ticket[];
  initialSearch: string;
  initialStatus: string;
  canCreate?: boolean;
  locale: string;
}

// =========================
// المكون الرئيسي
// =========================
export default function TicketsClient({
  initialTickets,
  initialSearch,
  initialStatus,
  canCreate = false,
  locale,
}: TicketsClientProps) {
  const router = useRouter();
  const isRtl = locale === "ar";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredTickets = useMemo(() => {
    let result = [...initialTickets];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          (t.code && t.code.toLowerCase().includes(term))
      );
    }
    if (selectedStatus !== "all") {
      result = result.filter((t) => t.status === selectedStatus);
    }
    return result;
  }, [initialTickets, searchTerm, selectedStatus]);

  const totalItems = filteredTickets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id: string, title: string) => {
    const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        error.error || (isRtl ? "فشل حذف البلاغ" : "Failed to delete ticket")
      );
    }
    toast.success(isRtl ? "تم حذف البلاغ بنجاح" : "Ticket deleted successfully");
    router.refresh();
  };

  const handleEdit = (id: string) => {
    router.push(`/${locale}/tickets/${id}/edit`);
  };

  const handleView = (id: string) => {
    router.push(`/${locale}/tickets/${id}`);
  };

  const filterSections: FilterSection[] = [
    {
      id: "status",
      label: isRtl ? "الحالة" : "Status",
      options: [
        { value: "all", label: isRtl ? "جميع الحالات" : "All Statuses" },
        { value: "PENDING", label: isRtl ? "معلق" : "Pending" },
        { value: "APPROVED", label: isRtl ? "مقبول" : "Approved" },
        { value: "REJECTED", label: isRtl ? "مرفوض" : "Rejected" },
      ],
    },
  ];

  const filterValues = { status: selectedStatus };
  const onFilterChange = (sectionId: string, value: string) => {
    if (sectionId === "status") setSelectedStatus(value);
    setCurrentPage(1);
  };

  // =========================
  // عرض عنصر التذكرة
  // =========================
  const renderTicket = (ticket: Ticket, actions: ItemActions) => {
    const statusInfo = getStatusDisplay(ticket.status, isRtl);
    const Icon = statusInfo.icon;
    const statusColor = statusInfo.hex;
    const glowStyle = {
      backgroundColor: `${statusColor}20`,
      color: statusColor,
      boxShadow: `0 0 20px ${statusColor}30`,
    };

    return (
      <div
        key={ticket.id}
        onClick={() => handleView(ticket.id)}
        className="group relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-2xl transition-all duration-300 cursor-pointer bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 hover:bg-white/90 dark:hover:bg-slate-900/90 hover:scale-[1.01] hover:shadow-xl shadow-sm hover:shadow-indigo-500/5 dark:hover:shadow-indigo-400/5"
      >
        {/* خلفية متدرجة خفيفة */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* الأيقونة الرئيسية */}
        <div
          className="relative z-10 h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
          style={glowStyle}
        >
          <Icon size={28} style={{ color: statusColor }} />
        </div>

        {/* البيانات الأساسية */}
        <div className="relative z-10 flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 truncate leading-none">
              {ticket.title}
            </h3>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/50 dark:border-slate-700/50">
              {ticket.code || `#${ticket.id.slice(-4)}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-indigo-400 dark:text-indigo-500" />
              <span className="font-medium">{getFullLocation(ticket.room, isRtl)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-400 dark:text-indigo-500" />
              <span className="font-medium">
                {new Date(ticket.createdAt).toLocaleDateString(
                  isRtl ? "ar-SA" : "en-US"
                )}
              </span>
            </div>
            {ticket.reporterName && (
              <div className="flex items-center gap-1.5">
                <User size={14} className="text-indigo-400 dark:text-indigo-500" />
                <span className="font-medium">{ticket.reporterName}</span>
              </div>
            )}
          </div>
        </div>

        {/* الحالة والإجراءات */}
        <div className="relative z-10 flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <span
            className="rounded-full text-xs font-semibold px-3 py-1.5 inline-flex items-center gap-1.5 border border-slate-200/30 dark:border-slate-700/30 shadow-sm"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
              boxShadow: `0 0 15px ${statusColor}25`,
            }}
          >
            <Icon size={12} /> {statusInfo.label}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => actions.edit(ticket.id)}
              className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
              title={isRtl ? "تعديل" : "Edit"}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => actions.delete(ticket.id, ticket.title)}
              disabled={actions.isDeleting && actions.deletingId === ticket.id}
              className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200 hover:scale-110 disabled:opacity-50"
            >
              {actions.isDeleting && actions.deletingId === ticket.id ? (
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

  // =========================
  // حساب إحصائيات الحالات
  // =========================
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialTickets.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [initialTickets]);

  // =========================
  // العرض مع رأس موحّد
  // =========================
  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة المخصص */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <ShieldCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {isRtl ? "البلاغات" : "Tickets"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRtl
                ? "إدارة ومتابعة كافة بلاغات الصيانة والحوادث"
                : "Manage and track all maintenance and incident tickets"}
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => router.push(`/${locale}/tickets/new`)}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
          >
            {isRtl ? "إنشاء بلاغ جديد" : "New Ticket"}
          </button>
        )}
      </div>

      {/* DataList بدون عنوان وزر إضافة (لتجنب التكرار) */}
      <DataList
        searchPlaceholder={
          isRtl
            ? "بحث برقم البلاغ أو العنوان..."
            : "Search by ticket number or title..."
        }
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterSections={filterSections}
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        items={paginatedTickets}
        total={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        renderItem={renderTicket}
        emptyMessage={isRtl ? "لا توجد بلاغات لعرضها" : "No tickets to display"}
        onEdit={handleEdit}
        onDelete={handleDelete}
        itemsPerPage={itemsPerPage}
        showPagination={true}
        className="relative z-10"
      />

      {/* ملخص الحالات */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/30 dark:border-slate-800/30 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <Sparkles size={16} className="text-indigo-400 dark:text-indigo-500" />
          <span>
            {isRtl
              ? `إجمالي البلاغات: ${initialTickets.length}`
              : `Total Tickets: ${initialTickets.length}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = statusCounts[status] || 0;
            if (count === 0) return null;
            const Icon = config.icon;
            return (
              <span
                key={status}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 dark:bg-slate-800/60 border border-slate-200/30 dark:border-slate-700/30"
                style={{ color: config.hex }}
              >
                <Icon size={10} />
                {count}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}