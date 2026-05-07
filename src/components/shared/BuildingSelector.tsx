// src/components/shared/BuildingSelector.tsx
"use client";

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

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
  const isDisabled = loading || buildings.length === 0;
  
  const selectedBuilding = buildings.find((b) => b.id === value);
  const displayValue = selectedBuilding ? selectedBuilding.name : undefined;

  const getPlaceholderText = () => {
    if (loading) return "جاري التحميل...";
    if (buildings.length === 0) return emptyMessage;
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
        {buildings.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
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