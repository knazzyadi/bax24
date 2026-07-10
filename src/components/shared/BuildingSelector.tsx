// src/components/shared/BuildingSelector.tsx
"use client";

import { useMemo } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

export interface Building {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

interface BuildingSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  buildings: Building[];
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export function BuildingSelector({
  value,
  onValueChange,
  buildings,
  placeholder,
  emptyMessage,
  loading = false,
  className = "",
  onOpenChange,
}: BuildingSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // ✅ تجميع الرسائل الافتراضية مع دعم اللغة
  const defaultText = {
    placeholder: isRtl ? "اختر المبنى" : "Select Building",
    empty: isRtl ? "لا توجد مباني" : "No buildings found",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
  };

  const buildingsList = Array.isArray(buildings) ? buildings : [];
  const isDisabled = loading || buildingsList.length === 0;

  // ✅ استخدام useMemo لتجنب البحث المتكرر
  const selectedBuilding = useMemo(
    () => buildingsList.find((b) => b.id === value),
    [buildingsList, value]
  );

  // ✅ دالة عرض الاسم مع الكود إن وجد
  const getDisplayName = (building: Building) => {
    const name = isRtl ? building.name : (building.nameEn || building.name);
    if (building.code) {
      return `${building.code} • ${name}`;
    }
    return name;
  };

  const displayValue = selectedBuilding ? getDisplayName(selectedBuilding) : undefined;

  const getPlaceholderText = () => {
    if (loading) return defaultText.loading;
    if (buildingsList.length === 0) return emptyMessage ?? defaultText.empty;
    return placeholder ?? defaultText.placeholder;
  };

  return (
    <div className={cn("w-full", className)}>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={isDisabled}
        onOpenChange={onOpenChange}
      >
        <SelectTrigger
          className={cn(
            "w-full flex items-center gap-2",
            loading && "opacity-70"
          )}
        >
          <SelectValue placeholder={getPlaceholderText()}>
            {displayValue}
          </SelectValue>
          {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {buildingsList.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {getDisplayName(b)}
            </SelectItem>
          ))}
          {buildingsList.length === 0 && !loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              {emptyMessage ?? defaultText.empty}
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}