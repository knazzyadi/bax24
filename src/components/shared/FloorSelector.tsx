"use client";

import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";

export interface Floor {
  id: string;
  name: string;
  nameEn?: string;
  buildingId: string;
}

interface FloorSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  floors: Floor[];
  buildingId?: string;
  placeholder?: string;
  emptyMessage?: string;
  noBuildingMessage?: string;
  loading?: boolean;
}

export function FloorSelector({ 
  value, 
  onValueChange, 
  floors, 
  buildingId, 
  placeholder = "اختر الدور",
  emptyMessage = "لا توجد أدوار",
  noBuildingMessage = "اختر المبنى أولاً",
  loading = false
}: FloorSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const filteredFloors = floors.filter((f) => f.buildingId === buildingId);
  const isDisabled = !buildingId || loading;

  const getDisplayName = (floor: Floor) => {
    return isRtl ? floor.name : (floor.nameEn || floor.name);
  };

  const selectedFloor = filteredFloors.find((f) => f.id === value);
  const displayValue = selectedFloor ? getDisplayName(selectedFloor) : undefined;

  const getPlaceholderText = () => {
    if (!buildingId) return noBuildingMessage;
    if (loading) return isRtl ? "جاري التحميل..." : "Loading...";
    if (filteredFloors.length === 0) return emptyMessage;
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
            {getDisplayName(f)}
          </SelectItem>
        ))}
        {filteredFloors.length === 0 && !loading && buildingId && (
          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
            {emptyMessage}
          </div>
        )}
      </SelectContent>
    </Select>
  );
}