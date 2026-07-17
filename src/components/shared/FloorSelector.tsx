// src/components/shared/FloorSelector.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Floor {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  buildingId: string;
}

interface FloorSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  floors: Floor[];
  buildingId: string;
  loading?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  noBuildingMessage?: string;
  className?: string;
  disabled?: boolean; // ✅ إضافة disabled
}

export function FloorSelector({
  value,
  onValueChange,
  floors,
  buildingId,
  loading = false,
  placeholder = "اختر الدور",
  emptyMessage = "لا توجد أدوار",
  noBuildingMessage = "اختر المبنى أولاً",
  className,
  disabled = false,
}: FloorSelectorProps) {
  const isDisabled = disabled || loading || !buildingId;

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
            !buildingId
              ? noBuildingMessage
              : loading
              ? "جاري التحميل..."
              : placeholder
          }
        />
      </SelectTrigger>
      <SelectContent>
        {!buildingId ? (
          <div className="p-2 text-center text-sm text-amber-500">
            {noBuildingMessage}
          </div>
        ) : loading ? (
          <div className="p-2 text-center text-sm text-muted-foreground">
            جاري التحميل...
          </div>
        ) : floors.length === 0 ? (
          <div className="p-2 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          floors.map((floor) => (
            <SelectItem key={floor.id} value={floor.id}>
              {floor.name} {floor.code ? `(${floor.code})` : ""}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}