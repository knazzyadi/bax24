// src/components/shared/RoomSelector.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  floorId: string;
  buildingId?: string;
  fullCode?: string;
}

interface RoomSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  rooms: Room[];
  floorId: string;
  loading?: boolean;
  placeholder?: string; // ✅ إعادة إضافة placeholder
  emptyMessage?: string;
  noFloorMessage?: string;
  className?: string;
  disabled?: boolean;
  isRtl?: boolean;
}

const NONE_VALUE = "__none__";

export function RoomSelector({
  value,
  onValueChange,
  rooms,
  floorId,
  loading = false,
  placeholder, // ✅ استقبال placeholder
  emptyMessage = "لا توجد غرف",
  noFloorMessage = "اختر الدور أولاً",
  className,
  disabled = false,
  isRtl = true,
}: RoomSelectorProps) {
  const safeRooms = (rooms || []).filter(Boolean);

  const defaultOption = {
    id: NONE_VALUE,
    name: isRtl ? "— اختر الغرفة —" : "— Select room —",
    code: "",
    floorId: "",
  };

  const displayRooms = floorId
    ? [defaultOption, ...safeRooms]
    : [];

  const selectValue = value || NONE_VALUE;

  const handleValueChange = (val: string) => {
    if (val === NONE_VALUE) {
      onValueChange("");
    } else {
      onValueChange(val);
    }
  };

  const getRoomDisplay = (room: Room) => {
    const name = isRtl
      ? room.name
      : room.nameEn || room.name;

    const code = room.fullCode || room.code;

    return code
      ? `${code}. ${name}`
      : name;
  };

  const isDisabled =
    disabled ||
    loading ||
    !floorId;

  // ✅ استخدام placeholder الممرر أو القيمة الافتراضية
  const placeholderText = placeholder ?? (isRtl ? "اختر الغرفة" : "Select room");

  return (
    <Select
      value={selectValue}
      onValueChange={handleValueChange}
      disabled={isDisabled}
    >
      <SelectTrigger
        className={cn(
          "h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4",
          className
        )}
      >
        <SelectValue placeholder={placeholderText} />
      </SelectTrigger>

      <SelectContent>
        {!floorId ? (
          <div className="px-2 py-2 text-sm text-amber-500">
            {noFloorMessage}
          </div>
        ) : loading ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            {isRtl ? "جاري التحميل..." : "Loading..."}
          </div>
        ) : safeRooms.length === 0 ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          displayRooms.map((room) => (
            <SelectItem
              key={room.id}
              value={room.id}
            >
              {room.id === NONE_VALUE
                ? room.name
                : getRoomDisplay(room)}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}