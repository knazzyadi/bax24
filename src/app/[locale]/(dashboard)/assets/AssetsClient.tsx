// src/app/[locale]/(dashboard)/assets/AssetsClient.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { toast } from "sonner";
import type { Asset, AssetType, AssetStatus } from "@/types/assets";
import { DataList, type FilterSection, type ItemActions } from "@/components/shared/DataList";
import { useDebounce } from "@/hooks/useDebounce"; // ✅ استيراد useDebounce

// ========== دوال مساعدة ==========
function getFullLocation(asset: Asset, isRtl: boolean): string {
  const room = asset.room;
  if (!room) return isRtl ? "موقع غير محدد" : "Location not set";
  const parts = [];
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

function getStatusDisplay(status: AssetStatus | null | undefined, isRtl: boolean) {
  if (!status) {
    return {
      label: isRtl ? "بدون حالة" : "No status",
      color: "#6b7280",
      icon: AlertCircle,
      hex: "#6b7280",
    };
  }
  const name = isRtl ? status.name : status.nameEn || status.name;
  const colorHex = status.color || "#6b7280";
  let Icon = CheckCircle2;
  const nameLower = name.toLowerCase();
  if (nameLower.includes("صيانة") || nameLower.includes("maintenance")) Icon = Wrench;
  else if (nameLower.includes("متقاعد") || nameLower.includes("retired")) Icon = AlertCircle;
  return { label: name, color: colorHex, icon: Icon, hex: colorHex };
}

function getTypeDisplay(type: AssetType | null | undefined, isRtl: boolean) {
  if (!type) return isRtl ? "غير مصنف" : "Uncategorized";
  return isRtl ? type.name : type.nameEn || type.name;
}

function formatDate(dateStr?: string | null, isRtl?: boolean): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(isRtl ? "ar-SA" : "en-US");
}

// ========== Props ==========
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

// ========== المكون الرئيسي ==========
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

  const [searchTerm, setSearchTerm] = useState(q);
  const [selectedTypeId, setSelectedTypeId] = useState(typeId || "all");
  const [selectedStatusId, setSelectedStatusId] = useState(statusId || "all");

  // ✅ استخدام useDebounce بدلاً من setTimeout
  const debouncedSearch = useDebounce(searchTerm, 500);

  // ✅ عند تغيير البحث أو الفلاتر، ننتقل إلى الصفحة الأولى مع الحفاظ على المعاملات
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (selectedTypeId !== 'all') params.set('typeId', selectedTypeId);
    if (selectedStatusId !== 'all') params.set('statusId', selectedStatusId);
    params.set('page', '1'); // ✅ إعادة تعيين إلى الصفحة الأولى عند البحث أو تغيير الفلتر
    router.push(`/${locale}/assets?${params.toString()}`);
  }, [debouncedSearch, selectedTypeId, selectedStatusId, locale, router]);

  // البحث والفلترة (على البيانات القادمة من الخادم)
  const assetMatchesSearch = (asset: Asset, term: string): boolean => {
    const lowerTerm = term.toLowerCase();
    if (asset.name.toLowerCase().includes(lowerTerm)) return true;
    if (asset.nameEn?.toLowerCase().includes(lowerTerm)) return true;
    if (asset.code.toLowerCase().includes(lowerTerm)) return true;
    const location = getFullLocation(asset, isRtl);
    if (location.toLowerCase().includes(lowerTerm)) return true;
    return false;
  };

  const filteredAssets = useMemo(() => {
    let result = [...initialAssets];
    if (searchTerm) {
      result = result.filter((asset) => assetMatchesSearch(asset, searchTerm));
    }
    if (selectedTypeId !== "all") {
      result = result.filter((asset) => asset.type?.id === selectedTypeId);
    }
    if (selectedStatusId !== "all") {
      result = result.filter((asset) => asset.status?.id === selectedStatusId);
    }
    return result;
  }, [initialAssets, searchTerm, selectedTypeId, selectedStatusId, isRtl]);

  // ===== دوال الحذف والتعديل =====
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

  // ===== الفلاتر =====
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
      boxShadow: `0 0 12px ${statusColor}80`,
    };

    return (
      <div
        key={asset.id}
        className="group flex flex-col md:flex-row items-start md:items-center gap-6 bg-card hover:bg-secondary/40 border border-border rounded-[2rem] p-5 px-8 transition-all duration-300 cursor-pointer"
        onClick={() => router.push(`/${locale}/assets/${asset.id}`)}
      >
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          style={glowStyle}
        >
          <Icon size={24} style={{ color: statusColor }} />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-normal group-hover:text-primary transition-colors duration-200 truncate leading-none text-foreground">
              {isRtl ? asset.name : asset.nameEn || asset.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-normal text-muted-foreground">
            <Package size={12} /> {getTypeDisplay(asset.type, isRtl)}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-normal text-muted-foreground mt-1">
            <div className="flex items-center gap-2">
              <MapPin size={12} /> {getFullLocation(asset, isRtl)}
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={12} />
              <span>
                {asset.purchaseDate
                  ? new Date(asset.purchaseDate).toLocaleDateString(
                      isRtl ? "ar-SA" : "en-US"
                    )
                  : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench size={12} />
              <span>
                {asset.lastMaintenanceDate
                  ? formatDate(asset.lastMaintenanceDate, isRtl)
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <span className="text-[12px] font-normal text-primary px-3 py-1.5 bg-primary/5 rounded-xl border border-primary/10 uppercase tracking-widest transition-colors duration-200 group-hover:bg-primary/20">
            {asset.code || `#${asset.id.slice(-4)}`}
          </span>
        </div>

        <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
          <span
            className="rounded-full font-black text-sm px-4 py-1.5 border-none shadow-md inline-flex items-center gap-1"
            style={glowStyle}
          >
            <Icon size={14} style={{ color: statusColor }} /> {statusInfo.label}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => actions.edit(asset.id)}
              className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 hover:scale-110"
              title={isRtl ? "تعديل" : "Edit"}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() =>
                actions.delete(asset.id, isRtl ? asset.name : asset.nameEn || asset.name)
              }
              disabled={actions.isDeleting && actions.deletingId === asset.id}
              className="p-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200 hover:scale-110 disabled:opacity-50"
            >
              {actions.isDeleting && actions.deletingId === asset.id ? (
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

  // ===== حساب نطاق الأرقام المعروضة =====
  const startIndex = pagination.startIndex;
  const endIndex = pagination.startIndex + pagination.currentCount - 1;
  const itemsPerPage = 10;

  return (
    <>
      <DataList
        title={isRtl ? "الأصول والمعدات" : "Assets & Equipment"}
        subtitle={
          isRtl
            ? "إدارة الأصول المركزية ومتابعة الحالة التشغيلية"
            : "Central asset management and operational status tracking"
        }
        icon={<Package size={28} />}
        addButtonLabel={isRtl ? "إضافة أصل جديد" : "Add New Asset"}
        addButtonLink={`/${locale}/assets/new`}
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
        items={filteredAssets}
        total={pagination.totalCount}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={(page) => {
          const params = new URLSearchParams();
          if (searchTerm) params.set('q', searchTerm);
          if (selectedTypeId !== 'all') params.set('typeId', selectedTypeId);
          if (selectedStatusId !== 'all') params.set('statusId', selectedStatusId);
          params.set('page', String(page));
          router.push(`/${locale}/assets?${params.toString()}`);
        }}
        renderItem={renderAssetItem}
        emptyMessage={isRtl ? "لا توجد أصول لعرضها" : "No assets to display"}
        onEdit={handleEditAsset}
        onDelete={handleDeleteAsset}
        itemsPerPage={itemsPerPage}
        showPagination={true}
      />
    </>
  );
}