// src/components/shared/DataList.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ChevronLeft, ChevronRight, Plus, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSection {
  id: string;
  label: string;
  options: FilterOption[];
}

export interface DataListProps<T> {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  items: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterSections?: FilterSection[];
  filterValues?: Record<string, string>;
  onFilterChange: (sectionId: string, value: string) => void;
  sortOptions?: { value: string; label: string }[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  onReset?: () => void;
  addButtonLabel?: string;
  addButtonLink?: string;
  renderItem: (item: T, actions: ItemActions) => React.ReactNode;
  emptyMessage?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => Promise<void>;
  onView?: (id: string) => void;
  itemsPerPage?: number;
  className?: string;
}

export interface ItemActions {
  edit: (id: string) => void;
  delete: (id: string, name: string) => void;
  view?: (id: string) => void;
  isDeleting: boolean;
  deletingId: string | null;
}

export function DataList<T extends { id: string }>({
  title,
  subtitle,
  icon,
  items,
  total,
  currentPage,
  totalPages,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "بحث...",
  filterSections = [],
  filterValues = {},
  onFilterChange,
  sortOptions,
  sortValue,
  onSortChange,
  onReset,
  addButtonLabel,
  addButtonLink,
  renderItem,
  emptyMessage = "لا توجد عناصر",
  onEdit,
  onDelete,
  onView,
  itemsPerPage = 10,
  className,
}: DataListProps<T>) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    setIsDeleting(true);
    setDeletingId(id);
    try {
      await onDelete(id, name);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const actions: ItemActions = {
    edit: onEdit,
    delete: handleDelete,
    view: onView,
    isDeleting,
    deletingId,
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(startItem + itemsPerPage - 1, total);

  // دالة للحصول على التسمية الحالية للفلتر
  const getCurrentFilterLabel = (section: FilterSection): string => {
    const currentValue = filterValues[section.id] || "all";
    const option = section.options.find(opt => opt.value === currentValue);
    return option ? option.label : section.label;
  };

  // دالة للحصول على التسمية الحالية للفرز (إذا وجد)
  const getCurrentSortLabel = (): string => {
    if (!sortValue || !sortOptions) return "ترتيب حسب";
    const option = sortOptions.find(opt => opt.value === sortValue);
    return option ? option.label : "ترتيب حسب";
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* الهيدر مع زر الإضافة */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary">{icon}</div>}
          <div>
            <h1 className="text-2xl font-black tracking-tight">{title}</h1>
            {subtitle && <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {addButtonLabel && addButtonLink && (
          <Button onClick={() => router.push(addButtonLink)} className="rounded-full font-black">
            {addButtonLabel}
          </Button>
        )}
      </div>

      {/* شريط البحث والفلاتر */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 rounded-full bg-background border-border"
          />
          {searchValue && (
            <button onClick={() => onSearchChange("")} className="absolute left-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {filterSections.map((section) => (
          <Select
            key={section.id}
            value={filterValues[section.id] || "all"}
            onValueChange={(val) => onFilterChange(section.id, val)}
          >
            <SelectTrigger className="w-[180px] rounded-full h-10 border-border">
              {getCurrentFilterLabel(section)}
            </SelectTrigger>
            <SelectContent>
              {section.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {sortOptions && sortOptions.length > 0 && onSortChange && (
          <Select value={sortValue || ""} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px] rounded-full h-10 border-border">
              {getCurrentSortLabel()}
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="rounded-full h-10 px-3"
            title="إعادة تعيين الفلاتر"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden md:inline ml-1">إعادة ضبط</span>
          </Button>
        )}
      </div>

      {/* عرض العناصر */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{emptyMessage}</div>
      ) : (
        <div className="space-y-4">{items.map((item) => renderItem(item, actions))}</div>
      )}

      {/* الترقيم */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <div className="text-sm text-muted-foreground">
            عرض {startItem} - {endItem} من {total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-full h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-full h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}