// src/components/shared/DataList.tsx
"use client";

import React, { useState, useEffect, useMemo, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSection {
  id: string;
  label: string;
  options: FilterOption[];
}

export interface ItemActions {
  edit: (id: string) => void;
  delete: (id: string, name: string) => void;
  isDeleting: boolean;
  deletingId: string | null;
}

export interface DataListProps<T = any> {
  items: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  renderItem: (item: T, actions: ItemActions) => ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  addButtonLabel?: string;
  addButtonLink?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchDebounce?: number;
  filterSections?: FilterSection[];
  filterValues?: Record<string, string>;
  onFilterChange?: (sectionId: string, value: string) => void;
  onReset?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => Promise<void>;
  emptyMessage?: string;
  showPagination?: boolean;
  className?: string;
}

export function DataList<T extends { id: string; name?: string }>({
  items,
  total,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  renderItem,
  title,
  subtitle,
  icon,
  addButtonLabel,
  addButtonLink,
  searchPlaceholder = "بحث...",
  searchValue = "",
  onSearchChange,
  searchDebounce = 300,
  filterSections = [],
  filterValues = {},
  onFilterChange,
  onReset,
  onEdit,
  onDelete,
  emptyMessage = "لا توجد بيانات",
  showPagination = true,
  className = "",
}: DataListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!onDelete) return;
    setIsDeleting(true);
    setDeletingId(id);
    try {
      await onDelete(id, name);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const actions: ItemActions = {
    edit: (id: string) => {
      if (onEdit) onEdit(id);
    },
    delete: (id: string, name: string) => {
      handleDelete(id, name);
    },
    isDeleting,
    deletingId,
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const startIndex = total > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * itemsPerPage, total);

  // ✅ تحويل filterSections إلى مصفوفة آمنة مع خيارات صالحة
  const safeFilterSections = useMemo(() => {
    return filterSections.map(section => ({
      ...section,
      options: Array.isArray(section.options) 
        ? section.options.filter(opt => opt && typeof opt === 'object' && 'value' in opt && 'label' in opt)
        : []
    }));
  }, [filterSections]);

  // ✅ دالة للحصول على الخيارات الآمنة مع قيمة افتراضية في حالة الفراغ
  const getSafeOptions = (section: FilterSection): FilterOption[] => {
    if (section.options.length === 0) {
      return [{ value: "all", label: section.label || "الكل" }];
    }
    return section.options;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {(title || addButtonLabel) && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon && <div className="text-primary">{icon}</div>}
            <div>
              {title && <h2 className="text-2xl font-bold">{title}</h2>}
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {addButtonLabel && addButtonLink && (
            <Link
              href={addButtonLink}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
              {addButtonLabel}
            </Link>
          )}
        </div>
      )}

      {(onSearchChange || safeFilterSections.length > 0 || onReset) && (
        <div className="flex flex-wrap items-center gap-3">
          {onSearchChange && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          {safeFilterSections.map((section) => {
            const safeOptions = getSafeOptions(section);
            const currentValue = filterValues[section.id] || safeOptions[0]?.value || "all";

            return (
              <div key={section.id} className="flex items-center gap-2">
                <Filter size={16} className="text-muted-foreground" />
                <select
                  value={currentValue}
                  onChange={(e) => onFilterChange?.(section.id, e.target.value)}
                  className="px-3 py-2 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {safeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          {onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
              {searchValue || Object.values(filterValues).some(v => v && v !== "all") ? "إعادة تعيين" : ""}
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{emptyMessage}</div>
        ) : (
          items.map((item) => renderItem(item, actions))
        )}
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-4">
          <div className="text-sm text-muted-foreground">
            عرض {startIndex} - {endIndex} من {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
            <span className="px-3 py-1 text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataList;