// src/components/shared/BuildingSelector.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Building {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

interface BuildingSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  buildings: Building[];
  loading?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean; // ✅ إضافة disabled
}

export function BuildingSelector({
  value,
  onValueChange,
  buildings,
  loading = false,
  placeholder = "اختر المبنى",
  emptyMessage = "لا توجد مباني",
  className,
  disabled = false, // ✅ إضافة قيمة افتراضية
}: BuildingSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || loading} // ✅ استخدام disabled
    >
      <SelectTrigger
        className={cn(
          "h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4",
          className
        )}
      >
        <SelectValue placeholder={loading ? "جاري التحميل..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {loading ? (
          <div className="p-2 text-center text-sm text-muted-foreground">
            جاري التحميل...
          </div>
        ) : buildings.length === 0 ? (
          <div className="p-2 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          buildings.map((building) => (
            <SelectItem key={building.id} value={building.id}>
              {building.name} {building.code ? `(${building.code})` : ""}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}