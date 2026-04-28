// src/components/shared/RoomSelector.tsx
//وظيفتهم اختيار مبنى → دور → غرفة
"use client";

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface Room {
  id: string;
  name: string;          // اسم الغرفة فقط (للعرض داخل القائمة)
  displayName?: string;  // الاسم مع الكود (للعرض في الحقل بعد الاختيار)
  floorId: string;
  buildingId?: string;
}

interface RoomSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  rooms: Room[];
  floorId?: string;
  placeholder?: string;
  loading?: boolean;
}

export function RoomSelector({ 
  value, 
  onValueChange, 
  rooms, 
  floorId, 
  placeholder = "اختر الغرفة",
  loading = false
}: RoomSelectorProps) {
  const isDisabled = !floorId || loading;

  const getPlaceholderText = () => {
    if (!floorId) return "اختر الدور أولاً";
    if (loading) return "جاري التحميل...";
    return placeholder;
  };

  // العثور على الغرفة المختارة للحصول على displayName
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
            {room.name}   {/* نعرض الاسم فقط داخل القائمة */}
          </SelectItem>
        ))}
        {rooms.length === 0 && !loading && floorId && (
          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
            لا توجد غرف
          </div>
        )}
      </SelectContent>
    </Select>
  );
}