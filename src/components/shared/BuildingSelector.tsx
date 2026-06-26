"use client";

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";

export interface Building {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

interface BuildingSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  buildings: Building[];
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
}

export function BuildingSelector({ 
  value, 
  onValueChange, 
  buildings, 
  placeholder = "اختر المبنى",
  emptyMessage = "لا توجد مباني",
  loading = false
}: BuildingSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const isDisabled = loading || buildings.length === 0;

  const getDisplayName = (building: Building) => {
    return isRtl ? building.name : (building.nameEn || building.name);
  };

  // ✅ بناء placeholder ديناميكي
  const getPlaceholderText = () => {
    if (loading) return isRtl ? "جاري التحميل..." : "Loading...";
    if (buildings.length === 0) return emptyMessage;
    return placeholder;
  };

  // ✅ الحصول على الاسم المعروض للقيمة المحددة
  const selectedBuilding = buildings.find(b => b.id === value);
  const displayValue = selectedBuilding ? getDisplayName(selectedBuilding) : undefined;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isDisabled}>
      <SelectTrigger className={loading ? "opacity-70" : ""}>
        <SelectValue placeholder={getPlaceholderText()}>
          {displayValue}
        </SelectValue>
        {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
      </SelectTrigger>
      <SelectContent>
        {buildings.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {getDisplayName(b)}
          </SelectItem>
        ))}
        {buildings.length === 0 && !loading && (
          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
            {emptyMessage}
          </div>
        )}
      </SelectContent>
    </Select>
  );
}