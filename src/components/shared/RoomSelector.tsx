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
  placeholder?: string;
  emptyMessage?: string;
  noFloorMessage?: string;
  className?: string;
  disabled?: boolean;
  isRtl?: boolean;
}

// ✅ نقل الثابت خارج المكون
const NONE_VALUE = "__none__";

export function RoomSelector({
  value,
  onValueChange,
  rooms,
  floorId,
  loading = false,
  placeholder = "اختر الغرفة",
  emptyMessage = "لا توجد غرف",
  noFloorMessage = "اختر الدور أولاً",
  className,
  disabled = false,
  isRtl = true,
}: RoomSelectorProps) {
  // ✅ حماية البيانات من null/undefined
  const safeRooms = (rooms || []).filter(Boolean);

  // ✅ خيار افتراضي يظهر دائماً (حتى لو كانت البيانات فارغة)
  const defaultOption = {
    id: NONE_VALUE,
    name: isRtl ? "— اختر الغرفة —" : "— Select room —",
    code: "",
    floorId: "",
  };

  // ✅ دمج الخيار الافتراضي مع الغرف دائماً (إذا كان هناك دور محدد)
  const displayRooms = floorId ? [defaultOption, ...safeRooms] : [];

  // تحويل القيمة الفارغة ("") إلى القيمة المميزة للعرض
  const selectValue = value || NONE_VALUE;

  const handleValueChange = (val: string) => {
    if (val === NONE_VALUE) {
      onValueChange(""); // إعادة تعيين إلى قيمة فارغة (لا شيء محدد)
    } else {
      onValueChange(val);
    }
  };

  // ✅ عرض الغرفة مع الكود (استخدام fullCode إن وجد)
  const getRoomDisplay = (room: Room) => {
    const name = isRtl ? room.name : (room.nameEn || room.name);
    const code = room.fullCode || room.code;
    return code ? `${code}. ${name}` : name;
  };

  const isDisabled = disabled || loading || !floorId;

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
        <SelectValue /> {/* ✅ بدون placeholder، لأن القيمة موجودة دائماً */}
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
            <SelectItem key={room.id} value={room.id}>
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