"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  FileText,
  Building,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Tag,
  Paperclip,
  User,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { DataList, type FilterSection, type ItemActions } from "@/components/shared/DataList";
import { cn } from "@/lib/utils";

interface Contract {
  id: string;
  code: string;
  title: string;
  supplier: string;
  type: string | null;
  value: number;
  startDate: string;
  endDate: string;
  status: "PENDING_REVIEW" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  notes: string | null;
  branchId: string | null;
  branch?: { id: string; name: string; nameEn?: string } | null;
  attachmentsCount?: number;
  agentName?: string | null;
  agentPhone?: string | null;
  agentEmail?: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: any; hex: string; glow: string }
> = {
  PENDING_REVIEW: {
    label: "قيد المراجعة",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    icon: Clock,
    hex: "#f59e0b",
    glow: "shadow-amber-500/20",
  },
  ACTIVE: {
    label: "نشط",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    icon: CheckCircle2,
    hex: "#10b981",
    glow: "shadow-emerald-500/20",
  },
  EXPIRED: {
    label: "منتهي",
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    icon: AlertCircle,
    hex: "#ef4444",
    glow: "shadow-rose-500/20",
  },
  CANCELLED: {
    label: "ملغي",
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-500/10 dark:bg-slate-500/20",
    icon: X,
    hex: "#64748b",
    glow: "shadow-slate-500/20",
  },
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
          c.supplier.toLowerCase().includes(term) ||
          (c.agentName && c.agentName.toLowerCase().includes(term))
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
      setCurrentPage(1);
    }
  };

  const renderContractItem = (contract: Contract, actions: ItemActions) => {
    const status = STATUS_CONFIG[contract.status] || STATUS_CONFIG.PENDING_REVIEW;
    const Icon = status.icon;
    const statusColor = status.hex;
    const glowStyle = {
      backgroundColor: `${statusColor}15`,
      color: statusColor,
      boxShadow: `0 0 20px ${statusColor}30`,
    };

    return (
      <div
        key={contract.id}
        className={cn(
          "group relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-2xl transition-all duration-300 cursor-pointer",
          "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50",
          "hover:bg-white/90 dark:hover:bg-slate-900/90",
          "hover:scale-[1.01] hover:shadow-xl",
          "shadow-sm hover:shadow-indigo-500/5 dark:hover:shadow-indigo-400/5"
        )}
        onClick={() => router.push(`/${locale}/contracts/${contract.id}`)}
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
              {contract.title}
            </h3>
            {contract.type && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100/50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                <Tag size={10} />
                {contract.type}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building size={14} className="text-indigo-400 dark:text-indigo-500" />
              <span className="font-medium">{contract.supplier}</span>
            </div>
            {contract.agentName && (
              <div className="flex items-center gap-1.5">
                <User size={14} className="text-indigo-400 dark:text-indigo-500" />
                <span className="font-medium">{contract.agentName}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <DollarSign size={14} className="text-emerald-400 dark:text-emerald-500" />
              <span className="font-medium">
                {new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US").format(contract.value)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span>{isRtl ? "البداية:" : "Start:"}</span>
              <span className="font-mono">{format(new Date(contract.startDate), "yyyy/MM/dd")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span>{isRtl ? "النهاية:" : "End:"}</span>
              <span className="font-mono">{format(new Date(contract.endDate), "yyyy/MM/dd")}</span>
            </div>
            {(contract.attachmentsCount ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip size={12} className="text-indigo-400" />
                <span>{contract.attachmentsCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* الكود والحالة */}
        <div className="relative z-10 flex items-center gap-4 shrink-0">
          <div className="text-right">
            <span className="text-sm font-mono text-slate-400 dark:text-slate-600">
              {contract.code || `#${contract.id.slice(-4)}`}
            </span>
          </div>

          <span
            className="rounded-full text-sm font-semibold px-4 py-1.5 border-none shadow-md inline-flex items-center gap-1.5 transition-all duration-200 group-hover:scale-105"
            style={{
              backgroundColor: `${statusColor}15`,
              color: statusColor,
              boxShadow: `0 0 15px ${statusColor}25`,
            }}
          >
            <Icon size={14} style={{ color: statusColor }} />
            {status.label}
          </span>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => actions.edit(contract.id)}
              className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
              title={isRtl ? "تعديل" : "Edit"}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => actions.delete(contract.id, contract.title)}
              disabled={actions.isDeleting && actions.deletingId === contract.id}
              className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200 hover:scale-110 disabled:opacity-50"
            >
              {actions.isDeleting && actions.deletingId === contract.id ? (
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
    <div className="space-y-6">
      {/* خلفية متدرجة خفيفة للصفحة */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

        <DataList
          title={isRtl ? "العقود" : "Contracts"}
          subtitle={
            isRtl
              ? "إدارة العقود ومتابعة الموردين والالتزامات المالية"
              : "Manage contracts, suppliers, and financial commitments"
          }
          icon={
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30">
              <FileText className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            </div>
          }
          addButtonLabel={isRtl ? "إضافة عقد جديد" : "Add New Contract"}
          addButtonLink={`/${locale}/contracts/new`}
          searchPlaceholder={
            isRtl
              ? "بحث بالعنوان، الكود، المورد، أو اسم المندوب..."
              : "Search by title, code, supplier, or agent name..."
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
          className="relative z-10"
        />
      </div>

      {/* ملخص أنيق في الأسفل */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/30 dark:border-slate-800/30 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <TrendingUp size={16} className="text-indigo-400 dark:text-indigo-500" />
          <span>
            {isRtl
              ? `إجمالي العقود: ${filteredContracts.length}`
              : `Total Contracts: ${filteredContracts.length}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = filteredContracts.filter((c) => c.status === key).length;
            if (count === 0) return null;
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 dark:bg-slate-800/60 border border-slate-200/30 dark:border-slate-700/30"
                style={{ color: config.hex }}
              >
                <config.icon size={10} />
                {count}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}