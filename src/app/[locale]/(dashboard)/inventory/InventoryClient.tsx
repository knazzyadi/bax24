// src/app/[locale]/(dashboard)/inventory/InventoryClient.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Package, MapPin, Calendar, Edit, Trash2, Loader2, ChevronLeft, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataList, type FilterSection, type ItemActions } from "@/components/shared/DataList";
import type { InventoryItem } from "./types";

function formatRoomLocation(room: any, isRtl: boolean): string {
  if (!room) return isRtl ? "موقع غير محدد" : "Location not set";
  const building = room.floor?.building;
  const floor = room.floor;
  const parts = [];
  if (building) parts.push(isRtl ? building.name : (building.nameEn || building.name));
  if (floor) parts.push(isRtl ? floor.name : (floor.nameEn || floor.name));
  parts.push(isRtl ? room.name : (room.nameEn || room.name));
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

  // تصفية البيانات محلياً
  const filteredItems = useMemo(() => {
    let result = [...initialItems];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          (item.nameEn?.toLowerCase().includes(term)) ||
          (item.sku?.toLowerCase().includes(term))
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
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (id: string) => {
    router.push(`/${locale}/inventory/${id}/edit`);
  };

  const handleDelete = async (id: string, name: string) => {
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "فشل الحذف");
    }
    toast.success(t("deleteSuccess"));
    router.refresh();
  };

  // ✅ تعريف الفلاتر (بدون value/onChange)
  const filterSections: FilterSection[] = [
    {
      id: "status",
      label: t("stockStatus"),
      options: [
        { value: "all", label: t("filterAll") },
        { value: "low", label: t("filterLow") },
        { value: "out", label: t("filterOut") },
      ],
    },
  ];

  // ✅ قيم الفلاتر الحالية
  const filterValues = { status: selectedStatus };

  // ✅ دالة تغيير الفلتر
  const onFilterChange = (sectionId: string, value: string) => {
    if (sectionId === "status") {
      setSelectedStatus(value);
      setCurrentPage(1); // إعادة تعيين الصفحة إلى 1
    }
  };

  const renderInventoryItem = (item: InventoryItem, actions: ItemActions) => {
    const isLow = item.quantity <= item.minQuantity;

    return (
      <div
        key={item.id}
        className="group flex flex-col md:flex-row items-start md:items-center gap-6 bg-card hover:bg-secondary/40 border border-border rounded-[2rem] p-5 px-8 transition-all duration-300 cursor-pointer"
        onClick={() => router.push(`/${locale}/inventory/${item.id}`)}
      >
        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 shrink-0">
          <Package size={24} />
        </div>

        <div className="w-28 shrink-0">
          <span className="text-[12px] font-black text-primary px-3 py-1.5 bg-primary/5 rounded-xl border border-primary/10 uppercase tracking-widest">
            {item.sku || `#${item.id.slice(-4)}`}
          </span>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black group-hover:text-primary truncate leading-none text-foreground">
              {isRtl ? item.name : (item.nameEn || item.name)}
            </h3>
            {isLow && (
              <Badge className="rounded-full font-black text-[10px] px-2 py-0.5 border-none bg-destructive/10 text-destructive">
                {t("lowStock")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold">
            <MapPin size={12} /> {formatRoomLocation(item.room, isRtl)}
          </div>
        </div>

        <div className="hidden md:block w-32 text-center">
          <div className={cn("text-lg font-black", isLow ? "text-destructive" : "text-emerald-500")}>
            {item.quantity} {item.unit || t("unit")}
          </div>
          <div className="text-[10px] text-muted-foreground font-bold">
            {t("minQuantity")}: {item.minQuantity}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3 w-40 text-muted-foreground shrink-0 justify-end">
          <span className="text-sm font-bold">
            {new Date(item.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => actions.edit(item.id)}
            className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 hover:scale-110"
            title={t("edit")}
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => actions.delete(item.id, isRtl ? item.name : (item.nameEn || item.name))}
            disabled={actions.isDeleting && actions.deletingId === item.id}
            className="p-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200 hover:scale-110 disabled:opacity-50"
          >
            {actions.isDeleting && actions.deletingId === item.id ? (
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
    );
  };

  return (
    <DataList
      title={t("title")}
      subtitle={t("subtitle")}
      icon={<Package size={28} />}
      addButtonLabel={t("addNew")}
      addButtonLink={`/${locale}/inventory/new`}
      searchPlaceholder={t("searchPlaceholder")}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filterSections={filterSections}
      filterValues={filterValues}      // ✅ إضافة
      onFilterChange={onFilterChange}  // ✅ إضافة
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
    />
  );
}