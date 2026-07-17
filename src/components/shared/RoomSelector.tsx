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
  disabled?: boolean; // ✅ إضافة disabled
}

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
}: RoomSelectorProps) {
  const isDisabled = disabled || loading || !floorId;

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={isDisabled}
    >
      <SelectTrigger
        className={cn(
          "h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4",
          className
        )}
      >
        <SelectValue
          placeholder={
            !floorId
              ? noFloorMessage
              : loading
              ? "جاري التحميل..."
              : placeholder
          }
        />
      </SelectTrigger>
      <SelectContent>
        {!floorId ? (
          <div className="p-2 text-center text-sm text-amber-500">
            {noFloorMessage}
          </div>
        ) : loading ? (
          <div className="p-2 text-center text-sm text-muted-foreground">
            جاري التحميل...
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-2 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          rooms.map((room) => (
            <SelectItem key={room.id} value={room.id}>
              {room.name} {room.fullCode ? `(${room.fullCode})` : ""}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}