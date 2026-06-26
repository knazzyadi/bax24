"use client";

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";

export interface Room {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  fullCode?: string;
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
}

export function RoomSelector({ 
  value, 
  onValueChange, 
  rooms, 
  floorId,
  placeholder = "اختر الوحدة",
  emptyMessage = "لا توجد وحدات",
  loading = false,
  noFloorMessage = "اختر الدور أولاً",
}: RoomSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const isDisabled = loading || rooms.length === 0 || !floorId;

  const getDisplayName = (room: Room) => {
    const name = isRtl ? room.name : (room.nameEn || room.name);
    if (room.fullCode) {
      return `${name} (${room.fullCode})`;
    }
    return name;
  };

  const selectedRoom = rooms.find(r => r.id === value);
  const displayValue = selectedRoom ? getDisplayName(selectedRoom) : undefined;

  const getPlaceholderText = () => {
    if (loading) return isRtl ? "جاري التحميل..." : "Loading...";
    if (!floorId) return noFloorMessage;
    if (rooms.length === 0) return emptyMessage;
    return placeholder;
  };

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isDisabled}>
      <SelectTrigger className={loading ? "opacity-70" : ""}>
        <SelectValue placeholder={getPlaceholderText()}>
          {displayValue}
        </SelectValue>
        {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
      </SelectTrigger>
      <SelectContent position="popper" sideOffset={4}>
        {rooms.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            {getDisplayName(r)}
          </SelectItem>
        ))}
        {rooms.length === 0 && !loading && (
          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
            {emptyMessage}
          </div>
        )}
      </SelectContent>
    </Select>
  );
}