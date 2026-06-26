"use client";

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";

export interface Floor {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

interface FloorSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  floors: Floor[];
  buildingId?: string;
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  noBuildingMessage?: string;
}

export function FloorSelector({ 
  value, 
  onValueChange, 
  floors, 
  buildingId,
  placeholder = "اختر الدور",
  emptyMessage = "لا توجد أدوار",
  loading = false,
  noBuildingMessage = "اختر المبنى أولاً",
}: FloorSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const isDisabled = loading || floors.length === 0 || !buildingId;

  const getDisplayName = (floor: Floor) => {
    return isRtl ? floor.name : (floor.nameEn || floor.name);
  };

  const selectedFloor = floors.find(f => f.id === value);
  const displayValue = selectedFloor ? getDisplayName(selectedFloor) : undefined;

  const getPlaceholderText = () => {
    if (loading) return isRtl ? "جاري التحميل..." : "Loading...";
    if (!buildingId) return noBuildingMessage;
    if (floors.length === 0) return emptyMessage;
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
        {floors.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {getDisplayName(f)}
          </SelectItem>
        ))}
        {floors.length === 0 && !loading && (
          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
            {emptyMessage}
          </div>
        )}
      </SelectContent>
    </Select>
  );
}