// src/components/shared/FloorSelector.tsx
"use client";

import { useMemo } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

export interface Floor {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

interface FloorSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  floors: Floor[];
  buildingId?: string;
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  noBuildingMessage?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export function FloorSelector({
  value,
  onValueChange,
  floors,
  buildingId,
  placeholder,
  emptyMessage,
  loading = false,
  noBuildingMessage,
  className = "",
  onOpenChange,
}: FloorSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // ✅ تجميع الرسائل الافتراضية مع دعم اللغة
  const defaultText = {
    placeholder: isRtl ? "اختر الدور" : "Select Floor",
    empty: isRtl ? "لا توجد أدوار" : "No floors found",
    noBuilding: isRtl ? "اختر المبنى أولاً" : "Select building first",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
  };

  const floorsList = Array.isArray(floors) ? floors : [];
  const isDisabled = loading || floorsList.length === 0 || !buildingId;

  // ✅ استخدام useMemo لتجنب البحث المتكرر (تحسين صغير)
  const selectedFloor = useMemo(
    () => floorsList.find((f) => f.id === value),
    [floorsList, value]
  );

  // ✅ دالة عرض الاسم مع الكود إن وجد
  const getDisplayName = (floor: Floor) => {
    const name = isRtl ? floor.name : (floor.nameEn || floor.name);
    if (floor.code) {
      return `${floor.code} • ${name}`;
    }
    return name;
  };

  const displayValue = selectedFloor ? getDisplayName(selectedFloor) : undefined;

  const getPlaceholderText = () => {
    if (loading) return defaultText.loading;
    if (!buildingId) return noBuildingMessage ?? defaultText.noBuilding;
    if (floorsList.length === 0) return emptyMessage ?? defaultText.empty;
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
          {floorsList.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {getDisplayName(f)}
            </SelectItem>
          ))}
          {floorsList.length === 0 && !loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              {emptyMessage ?? defaultText.empty}
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}