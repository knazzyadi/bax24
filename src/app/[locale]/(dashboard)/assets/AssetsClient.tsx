// src/app/[locale]/(dashboard)/assets/AssetsClient.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Package,
  AlertCircle,
  Wrench,
  CheckCircle2,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import type { Asset, AssetType, AssetStatus } from "@/types/assets";
import { DataList, type FilterSection, type ItemActions } from "@/components/shared/DataList";
import { useDebounce } from "@/hooks/useDebounce";

// ============================================================
// 1. تكوين الحالات
// ============================================================
const STATUS_CONFIG: Record<
  string,
  { label: { ar: string; en: string }; hex: string; icon: any; glow: string; bg: string }
> = {
  AVAILABLE: {
    label: { ar: "متاح", en: "Available" },
    hex: "#22c55e",
    icon: CheckCircle2,
    glow: "shadow-emerald-500/20",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  MAINTENANCE: {
    label: { ar: "تحت الصيانة", en: "Maintenance" },
    hex: "#f59e0b",
    icon: Wrench,
    glow: "shadow-amber-500/20",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  RETIRED: {
    label: { ar: "متقاعد", en: "Retired" },
    hex: "#ef4444",
    icon: AlertCircle,
    glow: "shadow-rose-500/20",
    bg: "bg-rose-50 dark:bg-rose-950/30",
  },
};

// ============================================================
// 2. دوال مساعدة لعرض البيانات
// ============================================================

/** عرض الحالة مع الأيقونة واللون */
function getStatusDisplay(status: AssetStatus | null | undefined, isRtl: boolean) {
  if (!status) {
    return {
      label: isRtl ? "بدون حالة" : "No status",
      hex: "#6b7280",
      icon: AlertCircle,
      glow: "shadow-slate-500/20",
      bg: "bg-slate-50 dark:bg-slate-800/30",
    };
  }
  const config = STATUS_CONFIG[status.id] || {
    label: { ar: status.name, en: status.nameEn || status.name },
    hex: status.color || "#6b7280",
    icon: AlertCircle,
    glow: "shadow-slate-500/20",
    bg: "bg-slate-50 dark:bg-slate-800/30",
  };
  return {
    label: isRtl ? config.label.ar : config.label.en,
    hex: config.hex,
    icon: config.icon,
    glow: config.glow,
    bg: config.bg,
  };
}

/** الحصول على الموقع الكامل (مبنى → دور → غرفة) */
function getFullLocation(asset: Asset, isRtl: boolean): string {
  const room = asset.room;
  if (!room) return isRtl ? "موقع غير محدد" : "Location not set";

  const parts: string[] = [];
  if (room.floor?.building) {
    const building = room.floor.building;
    parts.push(isRtl ? building.name : building.nameEn || building.name);
  }
  if (room.floor) {
    parts.push(isRtl ? room.floor.name : room.floor.nameEn || room.floor.name);
  }
  parts.push(isRtl ? room.name : room.nameEn || room.name);
  return parts.join(" - ");
}

/** عرض نوع الأصل */
function getTypeDisplay(type: AssetType | null | undefined, isRtl: boolean) {
  if (!type) return isRtl ? "غير مصنف" : "Uncategorized";
  return isRtl ? type.name : type.nameEn || type.name;
}

/** تنسيق التاريخ مع مراعاة اللغة */
function formatDateLocal(dateStr?: string | null, isRtl?: boolean): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(isRtl ? "ar-SA" : "en-US");
}

// ============================================================
// 3. الواجهات (Props)
// ============================================================
interface AssetsClientProps {
  initialAssets: Asset[];
  assetTypes: AssetType[];
  assetStatuses: AssetStatus[];
  q: string;
  typeId: string;
  statusId: string;
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
export default function AssetsClient({
  initialAssets,
  assetTypes,
  assetStatuses,
  q,
  typeId,
  statusId,
  locale,
  pagination,
}: AssetsClientProps) {
  const router = useRouter();
  const isRtl = locale === "ar";

  // حالة الفلاتر
  const [searchTerm, setSearchTerm] = useState(q);
  const [selectedTypeId, setSelectedTypeId] = useState(typeId || "all");
  const [selectedStatusId, setSelectedStatusId] = useState(statusId || "all");

  // تطبيق التأخير على البحث
  const debouncedSearch = useDebounce(searchTerm, 500);

  // تحديث URL عند تغيير الفلاتر
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (selectedTypeId !== "all") params.set("typeId", selectedTypeId);
    if (selectedStatusId !== "all") params.set("statusId", selectedStatusId);
    params.set("page", "1");
    router.push(`/${locale}/assets?${params.toString()}`);
  }, [debouncedSearch, selectedTypeId, selectedStatusId, locale, router]);

  // ===== دوال التعديل والحذف =====
  const handleDeleteAsset = async (id: string, name: string) => {
    const confirmed = window.confirm(
      isRtl
        ? `⚠️ هل أنت متأكد من حذف الأصل "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`
        : `⚠️ Are you sure you want to delete "${name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || (isRtl ? "فشل الحذف" : "Deletion failed"));
        return;
      }

      toast.success(isRtl ? "✅ تم حذف الأصل بنجاح" : "✅ Asset deleted successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(isRtl ? "حدث خطأ أثناء الاتصال بالخادم" : "Server connection error");
    }
  };

  const handleEditAsset = (id: string) => {
    router.push(`/${locale}/assets/${id}/edit`);
  };

  // ===== بناء الفلاتر =====
  const filterSections: FilterSection[] = [
    {
      id: "typeId",
      label: isRtl ? "النوع" : "Type",
      options: [
        { value: "all", label: isRtl ? "جميع الأنواع" : "All Types" },
        ...assetTypes.map((t) => ({
          value: t.id,
          label: isRtl ? t.name : t.nameEn || t.name,
        })),
      ],
    },
    {
      id: "statusId",
      label: isRtl ? "الحالة" : "Status",
      options: [
        { value: "all", label: isRtl ? "جميع الحالات" : "All Statuses" },
        ...assetStatuses.map((s) => ({
          value: s.id,
          label: isRtl ? s.name : s.nameEn || s.name,
        })),
      ],
    },
  ];

  const filterValues = {
    typeId: selectedTypeId,
    statusId: selectedStatusId,
  };

  const onFilterChange = (sectionId: string, value: string) => {
    if (sectionId === "typeId") setSelectedTypeId(value);
    else if (sectionId === "statusId") setSelectedStatusId(value);
  };

  // ===== عرض عنصر الأصل =====
  const renderAssetItem = (asset: Asset, actions: ItemActions) => {
    const statusInfo = getStatusDisplay(asset.status, isRtl);
    const Icon = statusInfo.icon;
    const statusColor = statusInfo.hex;
    const glowStyle = {
      backgroundColor: `${statusColor}20`,
      color: statusColor,
      boxShadow: `0 0 20px ${statusColor}30`,
    };

    return (
      <div
        key={asset.id}
        onClick={() => router.push(`/${locale}/assets/${asset.id}`)}
        className="group relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-2xl transition-all duration-300 cursor-pointer bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 hover:bg-white/90 dark:hover:bg-slate-900/90 hover:scale-[1.01] hover:shadow-xl shadow-sm hover:shadow-indigo-500/5 dark:hover:shadow-indigo-400/5"
      >
        {/* خلفية متدرجة خفيفة عند التمرير */}
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
              {isRtl ? asset.name : asset.nameEn || asset.name}
            </h3>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/50 dark:border-slate-700/50">
              {asset.code || `#${asset.id.slice(-4)}`}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50/50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
              <Tag size={10} />
              {getTypeDisplay(asset.type, isRtl)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-indigo-400 dark:text-indigo-500" />
              <span className="font-medium">{getFullLocation(asset, isRtl)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-400 dark:text-indigo-500" />
              <span className="font-medium">
                {asset.purchaseDate
                  ? new Date(asset.purchaseDate).toLocaleDateString(isRtl ? "ar-SA" : "en-US")
                  : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wrench size={14} className="text-indigo-400 dark:text-indigo-500" />
              <span className="font-medium">
                {asset.lastMaintenanceDate
                  ? formatDateLocal(asset.lastMaintenanceDate, isRtl)
                  : "—"}
              </span>
            </div>
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
              onClick={() => actions.edit(asset.id)}
              className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
              title={isRtl ? "تعديل" : "Edit"}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() =>
                actions.delete(asset.id, isRtl ? asset.name : asset.nameEn || asset.name)
              }
              disabled={actions.isDeleting && actions.deletingId === asset.id}
              className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200 hover:scale-110 disabled:opacity-50"
            >
              {actions.isDeleting && actions.deletingId === asset.id ? (
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

  // ===== ملخص الأنواع (يحسب عدد كل نوع ويعرضها) =====
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialAssets.forEach((a) => {
      const typeId = a.type?.id || "none";
      counts[typeId] = (counts[typeId] || 0) + 1;
    });
    return counts;
  }, [initialAssets]);

  // قائمة الأنواع الأكثر ظهوراً للعرض في الملخص
  const topTypes = useMemo(() => {
    return assetTypes
      .map((type) => ({
        ...type,
        count: typeCounts[type.id] || 0,
      }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [assetTypes, typeCounts]);

  // ============================================================
  // 5. العرض النهائي (مع رأس مخصص مثل باقي الصفحات)
  // ============================================================
  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة المخصص (مطابق لباقي الصفحات) */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {isRtl ? "الأصول والمعدات" : "Assets & Equipment"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRtl
                ? "إدارة الأصول المركزية ومتابعة الحالة التشغيلية"
                : "Central asset management and operational status tracking"}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/${locale}/assets/new`)}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
        >
          {isRtl ? "إضافة أصل جديد" : "Add New Asset"}
        </button>
      </div>

      {/* DataList بدون عنوان وزر إضافة (لتجنب التكرار) */}
      <DataList
        // لا نمرر title, subtitle, addButtonLabel, addButtonLink
        searchPlaceholder={
          isRtl
            ? "بحث باسم الأصل، الكود، أو الموقع..."
            : "Search by asset name, code, or location..."
        }
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterSections={filterSections}
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        items={initialAssets}
        total={pagination.totalCount}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={(page) => {
          const params = new URLSearchParams();
          if (searchTerm) params.set("q", searchTerm);
          if (selectedTypeId !== "all") params.set("typeId", selectedTypeId);
          if (selectedStatusId !== "all") params.set("statusId", selectedStatusId);
          params.set("page", String(page));
          router.push(`/${locale}/assets?${params.toString()}`);
        }}
        renderItem={renderAssetItem}
        emptyMessage={isRtl ? "لا توجد أصول لعرضها" : "No assets to display"}
        onEdit={handleEditAsset}
        onDelete={handleDeleteAsset}
        itemsPerPage={10}
        showPagination={true}
        className="relative z-10"
      />

      {/* ملخص الأنواع الأكثر استخداماً */}
      {topTypes.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/30 dark:border-slate-800/30 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <Sparkles size={16} className="text-indigo-400 dark:text-indigo-500" />
            <span>
              {isRtl
                ? `إجمالي الأصول: ${pagination.totalCount}`
                : `Total Assets: ${pagination.totalCount}`}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {topTypes.map((type) => (
              <span
                key={type.id}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 dark:bg-slate-800/60 border border-slate-200/30 dark:border-slate-700/30 text-slate-600 dark:text-slate-400"
              >
                <Tag size={10} />
                {isRtl ? type.name : type.nameEn || type.name} {type.count}
              </span>
            ))}
            {assetTypes.length > topTypes.length && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 dark:bg-slate-800/60 border border-slate-200/30 dark:border-slate-700/30 text-slate-600 dark:text-slate-400">
                +{assetTypes.length - topTypes.length}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}