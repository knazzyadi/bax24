// src/components/shared/RoomSelector.tsx
"use client";

import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface Room {
  id: string;
  name: string;
  nameEn?: string;
  floorId: string;
  buildingId?: string;
  displayName?: string; // الاسم مع الكود (اختياري)
}

interface RoomSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  rooms: Room[];
  floorId?: string;
  placeholder?: string;
  emptyMessage?: string;
  noFloorMessage?: string;
  loading?: boolean;
}

export function RoomSelector({ 
  value, 
  onValueChange, 
  rooms, 
  floorId, 
  placeholder = "اختر الغرفة",
  emptyMessage = "لا توجد غرف",
  noFloorMessage = "اختر الدور أولاً",
  loading = false
}: RoomSelectorProps) {
  const isDisabled = !floorId || loading;

  const getPlaceholderText = () => {
    if (!floorId) return noFloorMessage;
    if (loading) return "جاري التحميل...";
    return placeholder;
  };

  const selectedRoom = rooms.find(r => r.id === value);
  const displayValue = selectedRoom?.displayName || selectedRoom?.name || "";

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isDisabled}>
      <SelectTrigger className={loading ? "opacity-70" : ""}>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{getPlaceholderText()}</span>
          </div>
        ) : (
          displayValue || getPlaceholderText()
        )}
      </SelectTrigger>
      <SelectContent>
        {rooms.map((room) => (
          <SelectItem key={room.id} value={room.id}>
            {room.name}
          </SelectItem>
        ))}
        {rooms.length === 0 && !loading && floorId && (
          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
            {emptyMessage}
          </div>
        )}
      </SelectContent>
    </Select>
  );
}