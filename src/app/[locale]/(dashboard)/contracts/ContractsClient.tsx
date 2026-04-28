"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  FileText, Building, DollarSign, Calendar, AlertCircle, Clock,
  CheckCircle2, X, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, Tag
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { DataList, type FilterSection, type ItemActions } from "@/components/shared/DataList";

interface Contract {
  id: string;
  code: string;
  title: string;
  supplier: string;
  type: string | null;
  value: number;
  startDate: string;
  endDate: string;
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  notes: string | null;
  branchId: string | null;
  branch?: { id: string; name: string; nameEn?: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; hex: string }> = {
  PENDING_REVIEW: { label: "قيد المراجعة", color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock, hex: "#f59e0b" },
  ACTIVE: { label: "نشط", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2, hex: "#10b981" },
  EXPIRED: { label: "منتهي", color: "text-destructive", bg: "bg-destructive/10", icon: AlertCircle, hex: "#ef4444" },
  CANCELLED: { label: "ملغي (مفسوخ)", color: "text-orange-500", bg: "bg-orange-500/10", icon: X, hex: "#f97316" },
};

interface ContractsClientProps {
  initialContracts: Contract[];
  initialQ: string;
  initialStatus: string;
  locale: string;
}

export default function ContractsClient({
  initialContracts,
  initialQ,
  initialStatus,
  locale,
}: ContractsClientProps) {
  const router = useRouter();
  const isRtl = locale === "ar";
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus || "all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredContracts = useMemo(() => {
    let result = [...initialContracts];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(term) ||
          c.code.toLowerCase().includes(term) ||
          c.supplier.toLowerCase().includes(term)
      );
    }
    if (selectedStatus !== "all") {
      result = result.filter((c) => c.status === selectedStatus);
    }
    return result;
  }, [initialContracts, searchTerm, selectedStatus]);

  const totalItems = filteredContracts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (id: string) => {
    router.push(`/${locale}/contracts/${id}/edit`);
  };

  const handleDelete = async (id: string, title: string) => {
    const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "فشل الحذف");
    }
    toast.success(isRtl ? "تم حذف العقد بنجاح" : "Contract deleted successfully");
    router.refresh();
  };

  const filterSections: FilterSection[] = [
    {
      id: "status",
      label: isRtl ? "الحالة" : "Status",
      options: [
        { value: "all", label: isRtl ? "جميع الحالات" : "All Statuses" },
        ...Object.keys(STATUS_CONFIG).map((key) => ({
          value: key,
          label: STATUS_CONFIG[key].label,
        })),
      ],
    },
  ];

  const filterValues = { status: selectedStatus };
  const onFilterChange = (sectionId: string, value: string) => {
    if (sectionId === "status") {
      setSelectedStatus(value);
      setCurrentPage(1); // Reset to first page when filter changes
    }
  };

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US").format(value);

  const renderContractItem = (contract: Contract, actions: ItemActions) => {
    const status = STATUS_CONFIG[contract.status] || STATUS_CONFIG.PENDING_REVIEW;
    const Icon = status.icon;
    const statusColor = status.hex;
    const glowStyle = {
      backgroundColor: `${statusColor}20`,
      color: statusColor,
      boxShadow: `0 0 12px ${statusColor}80`,
    };

    return (
      <div
        key={contract.id}
        className="group flex flex-col md:flex-row items-start md:items-center gap-6 bg-card hover:bg-secondary/40 border border-border rounded-[2rem] p-5 px-8 transition-all duration-300 cursor-pointer"
        onClick={() => router.push(`/${locale}/contracts/${contract.id}`)}
      >
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          style={glowStyle}
        >
          <Icon size={24} style={{ color: statusColor }} />
        </div>

        {/* بيانات العقد */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black group-hover:text-primary transition-colors duration-200 truncate leading-none text-foreground">
              {contract.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold">
            <Building size={12} /> {contract.supplier}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-bold">
            <div className="flex items-center gap-2">
              <Building size={12} />
              {contract.branch?.name || (isRtl ? "غير محدد" : "Not specified")}
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={12} />
              {isRtl ? "ينتهي:" : "Ends:"}
              <span className="font-mono">{format(new Date(contract.endDate), "yyyy/MM/dd")}</span>
            </div>
          </div>
          {contract.type && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold">
              <Tag size={12} /> {contract.type}
            </div>
          )}
        </div>

        {/* رقم العقد (مكان المبلغ سابقاً) */}
        <div className="shrink-0">
          <span className="text-lg font-black text-primary transition-colors duration-200 group-hover:text-primary/70">
            {contract.code || `#${contract.id.slice(-4)}`}
          </span>
        </div>

        <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
          <span
            className="rounded-full font-black text-sm px-4 py-1.5 border-none shadow-md inline-flex items-center gap-1"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
              boxShadow: `0 0 10px ${statusColor}80`,
            }}
          >
            <Icon size={14} style={{ color: statusColor }} /> {status.label}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => actions.edit(contract.id)}
              className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 hover:scale-110"
              title={isRtl ? "تعديل" : "Edit"}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => actions.delete(contract.id, contract.title)}
              disabled={actions.isDeleting && actions.deletingId === contract.id}
              className="p-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200 hover:scale-110 disabled:opacity-50"
            >
              {actions.isDeleting && actions.deletingId === contract.id ? (
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
      title={isRtl ? "العقود" : "Contracts"}
      subtitle={
        isRtl
          ? "إدارة العقود ومتابعة الموردين والالتزامات المالية"
          : "Manage contracts, suppliers, and financial commitments"
      }
      icon={<FileText size={28} />}
      addButtonLabel={isRtl ? "إضافة عقد جديد" : "Add New Contract"}
      addButtonLink={`/${locale}/contracts/new`}
      searchPlaceholder={
        isRtl ? "بحث بالعنوان، الكود، أو المورد..." : "Search by title, code, or supplier..."
      }
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filterSections={filterSections}
      filterValues={filterValues}
      onFilterChange={onFilterChange}
      items={paginatedContracts}
      total={totalItems}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      renderItem={renderContractItem}
      emptyMessage={isRtl ? "لا توجد عقود لعرضها" : "No contracts to display"}
      onEdit={handleEdit}
      onDelete={handleDelete}
      itemsPerPage={itemsPerPage}
    />
  );
}