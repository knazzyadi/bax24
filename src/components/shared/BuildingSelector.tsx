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
  disabled?: boolean;
}

// ✅ نقل الثابت خارج المكون لتجنب إعادة الإنشاء في كل ريندر
const NONE_VALUE = "__none__";

export function BuildingSelector({
  value,
  onValueChange,
  buildings,
  loading = false,
  placeholder = "اختر المبنى",
  emptyMessage = "لا توجد مباني",
  className,
  disabled = false,
}: BuildingSelectorProps) {
  // ✅ حماية البيانات من null/undefined
  const safeBuildings = (buildings || []).filter(Boolean);

  // ✅ خيار افتراضي يظهر دائماً (حتى لو كانت البيانات فارغة)
  const defaultOption = { id: NONE_VALUE, name: placeholder, code: "" };

  // ✅ دمج الخيار الافتراضي مع المباني دائماً
  const displayBuildings = [defaultOption, ...safeBuildings];

  // تحويل القيمة الفارغة ("" ) إلى القيمة المميزة للعرض
  const selectValue = value || NONE_VALUE;

  const handleValueChange = (val: string) => {
    if (val === NONE_VALUE) {
      onValueChange(""); // إعادة تعيين إلى قيمة فارغة (لا شيء محدد)
    } else {
      onValueChange(val);
    }
  };

  return (
    <Select
      value={selectValue}
      onValueChange={handleValueChange}
      disabled={disabled || loading}
    >
      <SelectTrigger
        className={cn(
          "h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4",
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {loading ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            جاري التحميل...
          </div>
        ) : safeBuildings.length === 0 ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          displayBuildings.map((building) => (
            <SelectItem key={building.id} value={building.id}>
              {building.id === NONE_VALUE
                ? building.name
                : `${building.code || ""}${building.code ? ". " : ""}${building.name}`}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}