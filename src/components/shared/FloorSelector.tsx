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
  disabled?: boolean;
  isRtl?: boolean;
}

// ✅ نقل الثابت خارج المكون
const NONE_VALUE = "__none__";

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
  isRtl = true,
}: FloorSelectorProps) {
  // ✅ حماية البيانات من null/undefined
  const safeFloors = (floors || []).filter(Boolean);

  // ✅ خيار افتراضي يظهر دائماً (حتى لو كانت البيانات فارغة)
  const defaultOption = {
    id: NONE_VALUE,
    name: isRtl ? "— اختر الدور —" : "— Select floor —",
    code: "",
    buildingId: "",
  };

  // ✅ دمج الخيار الافتراضي مع الأدوار دائماً (إذا كان هناك مبنى محدد)
  const displayFloors = buildingId ? [defaultOption, ...safeFloors] : [];

  // تحويل القيمة الفارغة ("") إلى القيمة المميزة للعرض
  const selectValue = value || NONE_VALUE;

  const handleValueChange = (val: string) => {
    if (val === NONE_VALUE) {
      onValueChange(""); // إعادة تعيين إلى قيمة فارغة (لا شيء محدد)
    } else {
      onValueChange(val);
    }
  };

  // ✅ عرض اسم الدور مع الرمز (مثل BuildingSelector)
  const getFloorDisplay = (floor: Floor) => {
    const name = isRtl ? floor.name : (floor.nameEn || floor.name);
    return floor.code ? `${floor.code}. ${name}` : name;
  };

  const isDisabled = disabled || loading || !buildingId;

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
        {!buildingId ? (
          // ✅ رسالة "اختر المبنى أولاً" كعنصر عادي
          <div className="px-2 py-2 text-sm text-amber-500">
            {noBuildingMessage}
          </div>
        ) : loading ? (
          // ✅ رسالة تحميل كعنصر عادي
          <div className="px-2 py-2 text-sm text-muted-foreground">
            {isRtl ? "جاري التحميل..." : "Loading..."}
          </div>
        ) : safeFloors.length === 0 ? (
          // ✅ رسالة فارغة كعنصر عادي
          <div className="px-2 py-2 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          displayFloors.map((floor) => (
            <SelectItem key={floor.id} value={floor.id}>
              {floor.id === NONE_VALUE
                ? floor.name
                : getFloorDisplay(floor)}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}