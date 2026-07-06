// src/app/[locale]/(dashboard)/inventory/InventoryClient.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Package,
  MapPin,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DataList,
  type FilterSection,
  type ItemActions,
} from "@/components/shared/DataList";
import type { InventoryItem } from "./types";

type RoomLocation = InventoryItem["room"];

function formatRoomLocation(room: RoomLocation, isRtl: boolean): string {
  if (!room) {
    return isRtl ? "موقع غير محدد" : "Location not set";
  }

  const building = room.floor?.building;
  const floor = room.floor;
  const parts: string[] = [];

  if (building) {
    parts.push(isRtl ? building.name : building.nameEn || building.name);
  }
  if (floor) {
    parts.push(isRtl ? floor.name : floor.nameEn || floor.name);
  }
  parts.push(isRtl ? room.name : room.nameEn || room.name);

  return parts.join(" - ");
}

interface InventoryClientProps {
  initialItems: InventoryItem[];
  initialSearch: string;
  initialStatus: string;
  locale: string;
}

export default function InventoryClient({
  initialItems,
  initialSearch,
  initialStatus,
  locale,
}: InventoryClientProps) {
  const router = useRouter();
  const t = useTranslations("Inventory");
  const isRtl = locale === "ar";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus || "all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ===== التصفية =====
  const filteredItems = useMemo(() => {
    let result = [...initialItems];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.nameEn?.toLowerCase().includes(term) ||
          item.sku?.toLowerCase().includes(term)
      );
    }

    if (selectedStatus === "low") {
      result = result.filter((item) => item.quantity <= item.minQuantity);
    } else if (selectedStatus === "out") {
      result = result.filter((item) => item.quantity === 0);
    }

    return result;
  }, [initialItems, searchTerm, selectedStatus]);

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ===== دوال التعديل والحذف =====
  const handleEdit = (id: string) => {
    router.push(`/${locale}/inventory/${id}/edit`);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t("deleteError"));
      }
      toast.success(t("deleteSuccess"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("deleteError"));
      throw error;
    }
  };

  // ===== الفلاتر =====
  const filterSections = useMemo<FilterSection[]>(
    () => [
      {
        id: "status",
        label: t("stockStatus"),
        options: [
          { value: "all", label: t("filterAll") },
          { value: "low", label: t("filterLow") },
          { value: "out", label: t("filterOut") },
        ],
      },
    ],
    [t]
  );

  const filterValues = { status: selectedStatus };

  const onFilterChange = (sectionId: string, value: string) => {
    if (sectionId === "status") {
      setSelectedStatus(value);
      setCurrentPage(1);
    }
  };

  // ===== عرض عنصر المخزون (بتنسيق موحّد) =====
  const renderInventoryItem = (item: InventoryItem, actions: ItemActions) => {
    const isLow = item.quantity <= item.minQuantity;
    const statusColor = isLow ? "#ef4444" : "#22c55e";

    return (
      <div
        key={item.id}
        onClick={() => router.push(`/${locale}/inventory/${item.id}`)}
        className="group relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-2xl transition-all duration-300 cursor-pointer bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 hover:bg-white/90 dark:hover:bg-slate-900/90 hover:scale-[1.01] hover:shadow-xl shadow-sm hover:shadow-indigo-500/5 dark:hover:shadow-indigo-400/5"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div
          className="relative z-10 h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
          style={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
            boxShadow: `0 0 20px ${statusColor}30`,
          }}
        >
          <Package size={28} style={{ color: statusColor }} />
        </div>

        <div className="relative z-10 flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 truncate leading-none">
              {isRtl ? item.name : item.nameEn || item.name}
            </h3>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/50 dark:border-slate-700/50">
              {item.sku || `#${item.id.slice(-4)}`}
            </span>
            {isLow && (
              <Badge className="rounded-full font-black text-[10px] px-2 py-0.5 border-none bg-rose-500/10 text-rose-500">
                {t("lowStock")}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-indigo-400 dark:text-indigo-500" />
              <span className="font-medium">{formatRoomLocation(item.room, isRtl)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">
                {t("quantity")}:{" "}
                <span className={cn("font-bold", isLow ? "text-rose-500" : "text-emerald-500")}>
                  {item.quantity} {item.unit || t("unit")}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {t("minQuantity")}: {item.minQuantity}
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <button
              onClick={() => actions.edit(item.id)}
              className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
              title={t("edit")}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => actions.delete(item.id, isRtl ? item.name : item.nameEn || item.name)}
              disabled={actions.isDeleting && actions.deletingId === item.id}
              className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200 hover:scale-110 disabled:opacity-50"
            >
              {actions.isDeleting && actions.deletingId === item.id ? (
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

  // ============================================================
  // العرض النهائي (مع تنسيقات موحّدة)
  // ============================================================
  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة (مخصص) */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t("title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/${locale}/inventory/new`)}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
        >
          {t("addNew")}
        </button>
      </div>

      {/* DataList بدون عنوان أو زر إضافة (لتجنب التكرار) */}
      <DataList
        searchPlaceholder={t("searchPlaceholder")}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterSections={filterSections}
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        items={paginatedItems}
        total={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        renderItem={renderInventoryItem}
        emptyMessage={t("noItems")}
        onEdit={handleEdit}
        onDelete={handleDelete}
        itemsPerPage={itemsPerPage}
        showPagination={true}
        className="relative z-10"
        // لا نمرر title, subtitle, addButtonLabel, addButtonLink
      />

      {/* ملخص سريع */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/30 dark:border-slate-800/30 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <Sparkles size={16} className="text-indigo-400 dark:text-indigo-500" />
            <span>
              {isRtl ? `إجمالي العناصر: ${totalItems}` : `Total Items: ${totalItems}`}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 dark:bg-slate-800/60 border border-slate-200/30 dark:border-slate-700/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {isRtl ? "متاح" : "Available"}{" "}
              {initialItems.filter((i) => i.quantity > i.minQuantity).length}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 dark:bg-slate-800/60 border border-slate-200/30 dark:border-slate-700/30">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {isRtl ? "منخفض" : "Low"}{" "}
              {initialItems.filter((i) => i.quantity <= i.minQuantity && i.quantity > 0).length}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 dark:bg-slate-800/60 border border-slate-200/30 dark:border-slate-700/30">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              {isRtl ? "نفذ" : "Out"}{" "}
              {initialItems.filter((i) => i.quantity === 0).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}