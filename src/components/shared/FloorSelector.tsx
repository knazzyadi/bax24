// src/components/shared/FloorSelector.tsx
//وظيفتهم اختيار مبنى → دور → غرفة
"use client";

import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface Floor {
  id: string;
  name: string;
  buildingId: string;
}

interface FloorSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  floors: Floor[];
  buildingId?: string;
  placeholder?: string;
  loading?: boolean;
}

export function FloorSelector({ 
  value, 
  onValueChange, 
  floors, 
  buildingId, 
  placeholder = "اختر الدور",
  loading = false
}: FloorSelectorProps) {
  const filteredFloors = floors.filter((f) => f.buildingId === buildingId);
  const isDisabled = !buildingId || loading;
  
  // العثور على اسم الدور المحدد
  const selectedFloor = filteredFloors.find((f) => f.id === value);
  const displayValue = selectedFloor ? selectedFloor.name : undefined;

  const getPlaceholderText = () => {
    if (!buildingId) return "اختر المبنى أولاً";
    if (loading) return "جاري التحميل...";
    return placeholder;
  };

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
        {filteredFloors.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.name}
          </SelectItem>
        ))}
        {filteredFloors.length === 0 && !loading && buildingId && (
          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
            لا توجد أدوار
          </div>
        )}
      </SelectContent>
    </Select>
  );
}