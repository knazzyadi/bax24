// src/components/shared/RoomSelector.tsx
"use client";

import { useMemo } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

export interface Room {
  id: string;
  name: string;
  nameEn?: string;
  fullCode?: string; // ✅ الكود الكامل (مثل GF-101)
}

interface RoomSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  rooms: Room[];
  floorId?: string;
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  noFloorMessage?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export function RoomSelector({
  value,
  onValueChange,
  rooms,
  floorId,
  placeholder,
  emptyMessage,
  loading = false,
  noFloorMessage,
  className = "",
  onOpenChange,
}: RoomSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // ✅ تجميع الرسائل في كائن واحد للتنظيم
  const defaultText = {
    placeholder: isRtl ? "اختر الوحدة" : "Select Room",
    empty: isRtl ? "لا توجد وحدات" : "No rooms found",
    noFloor: isRtl ? "اختر الدور أولاً" : "Select floor first",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
  };

  const isDisabled = loading || rooms.length === 0 || !floorId;

  // ✅ استخدام useMemo للتحسين (مع أن العملية بسيطة لكنها لا تضر)
  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === value),
    [rooms, value]
  );

  // ✅ دالة عرض بدون useCallback (لأنها لا تُمرر للأطفال)
  const getDisplayName = (room: Room) => {
    const name = isRtl ? room.name : (room.nameEn || room.name);
    if (room.fullCode) {
      return `${room.fullCode} • ${name}`;
    }
    return name;
  };

  const displayValue = selectedRoom ? getDisplayName(selectedRoom) : undefined;

  const getPlaceholderText = () => {
    if (loading) return defaultText.loading;
    if (!floorId) return noFloorMessage ?? defaultText.noFloor;
    if (rooms.length === 0) return emptyMessage ?? defaultText.empty;
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
          {rooms.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {getDisplayName(r)}
            </SelectItem>
          ))}
          {rooms.length === 0 && !loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              {emptyMessage ?? defaultText.empty}
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}