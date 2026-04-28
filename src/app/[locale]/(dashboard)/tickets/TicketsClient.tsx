// src/app/[locale]/(dashboard)/tickets/TicketsClient.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ShieldCheck, AlertCircle, MapPin, Calendar,
  Edit, Trash2, Loader2, ChevronLeft, ChevronRight, User
} from "lucide-react";
import { toast } from "sonner";
import { DataList, type FilterSection, type ItemActions } from "@/components/shared/DataList";
import type { Ticket } from "./types";

function getStatusBadge(status: string, isRtl: boolean) {
  switch (status) {
    case "PENDING": return { label: isRtl ? "معلق" : "Pending", hex: "#f59e0b" };
    case "APPROVED": return { label: isRtl ? "مقبول" : "Approved", hex: "#10b981" };
    case "REJECTED": return { label: isRtl ? "مرفوض" : "Rejected", hex: "#ef4444" };
    default: return { label: isRtl ? "غير معروف" : "Unknown", hex: "#6b7280" };
  }
}

function getFullLocation(room: any, isRtl: boolean): string {
  if (!room) return "—";
  const floor = room.floor;
  const building = floor?.building;
  const buildingName = building ? (isRtl ? building.name : building.nameEn || building.name) : "";
  const floorName = floor ? (isRtl ? floor.name : floor.nameEn || floor.name) : "";
  const roomName = isRtl ? room.name : room.nameEn || room.name;
  return [buildingName, floorName, roomName].filter(p => p).join(" - ");
}

interface TicketsClientProps {
  initialTickets: Ticket[];
  initialSearch: string;
  initialStatus: string;
  canCreate?: boolean;
}

export default function TicketsClient({
  initialTickets,
  initialSearch,
  initialStatus,
  canCreate = false,
}: TicketsClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredTickets = useMemo(() => {
    let result = [...initialTickets];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(term) ||
        (t.code && t.code.toLowerCase().includes(term))
      );
    }
    if (selectedStatus !== "all") {
      result = result.filter(t => t.status === selectedStatus);
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
      throw new Error(error.error || (isRtl ? "فشل حذف البلاغ" : "Failed to delete ticket"));
    }
    toast.success(isRtl ? "تم حذف البلاغ بنجاح" : "Ticket deleted successfully");
    router.refresh();
  };

  const handleEdit = (id: string) => {
    router.push(`/${locale}/tickets/${id}/edit`);
  };

  const handleView = (id: string) => {
    console.log("🟢 Navigating to ticket:", id);
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

  const renderTicket = (ticket: Ticket, actions: ItemActions) => {
    const statusInfo = getStatusBadge(ticket.status, isRtl);
    const fullLocation = getFullLocation(ticket.room, isRtl);
    const glowStyle = {
      backgroundColor: `${statusInfo.hex}20`,
      color: statusInfo.hex,
      boxShadow: `0 0 12px ${statusInfo.hex}80`,
    };

    // ✅ نستخدم div مع onClick، ونضع key هنا (وليس داخل DataList)
    return (
      <div
        key={ticket.id}
        className="group flex flex-col md:flex-row items-start md:items-center gap-6 bg-card hover:bg-secondary/40 border border-border rounded-[2rem] p-5 px-8 transition-all duration-300 cursor-pointer"
        onClick={() => handleView(ticket.id)}
      >
        {/* أيقونة الحالة */}
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105" style={glowStyle}>
          <AlertCircle size={24} style={{ color: statusInfo.hex }} />
        </div>

        {/* المعلومات الأساسية */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black group-hover:text-primary transition-colors duration-200 truncate leading-none text-foreground">
              {ticket.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold">
            <MapPin size={12} /> {fullLocation}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-bold mt-1">
            <div className="flex items-center gap-2">
              <Calendar size={12} />
              <span>{new Date(ticket.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}</span>
            </div>
            {ticket.reporterName && (
              <div className="flex items-center gap-2">
                <User size={12} /> {ticket.reporterName}
              </div>
            )}
          </div>
        </div>

        {/* الجهة اليمنى: الكود + الحالة + الأزرار */}
        <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
          <span className="text-[14px] font-black text-primary px-3 py-1.5 bg-primary/5 rounded-xl border border-primary/10 uppercase tracking-widest transition-colors duration-200 group-hover:bg-primary/20">
            {ticket.code || `#${ticket.id.slice(-4)}`}
          </span>
          <span className="rounded-full font-black text-sm px-4 py-1.5 border-none shadow-md inline-flex items-center gap-1 transition-all duration-200 group-hover:scale-105 group-hover:brightness-110" style={glowStyle}>
            <AlertCircle size={14} style={{ color: statusInfo.hex }} /> {statusInfo.label}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => actions.edit(ticket.id)}
              className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 hover:scale-110"
              title={isRtl ? "تعديل" : "Edit"}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => actions.delete(ticket.id, ticket.title)}
              disabled={actions.isDeleting && actions.deletingId === ticket.id}
              className="p-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200 hover:scale-110 disabled:opacity-50"
            >
              {actions.isDeleting && actions.deletingId === ticket.id ? (
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
      title={isRtl ? "البلاغات" : "Tickets"}
      subtitle={isRtl ? "إدارة ومتابعة كافة بلاغات الصيانة والحوادث" : "Manage and track all maintenance and incident tickets"}
      icon={<ShieldCheck size={28} />}
      addButtonLabel={canCreate ? (isRtl ? "إنشاء بلاغ جديد" : "New Ticket") : undefined}
      addButtonLink={canCreate ? `/${locale}/tickets/new` : undefined}
      searchPlaceholder={isRtl ? "بحث برقم البلاغ أو العنوان..." : "Search by ticket number or title..."}
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
    />
  );
}