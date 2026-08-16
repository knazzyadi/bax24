// src/app/[locale]/(dashboard)/assets/bulk-import/LocationSelector.tsx
"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Building } from "@/types/assets";

interface LocationSelectorProps {
  location: {
    buildings: Building[];
    selectedBuildingId: string;
    loadingBuildings: boolean;
    handleBuildingChange: (id: string) => void;
  };
  isRtl: boolean;
}

export function LocationSelector({
  location,
  isRtl,
}: LocationSelectorProps) {
  const {
    buildings,
    selectedBuildingId,
    loadingBuildings,
    handleBuildingChange,
  } = location;

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm">
      <div className="max-w-md">
        <Label className="text-sm font-medium">
          {isRtl ? "المبنى" : "Building"}
        </Label>

        <Select
          value={selectedBuildingId}
          onValueChange={handleBuildingChange}
          disabled={loadingBuildings}
        >
          <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 mt-2">
            <SelectValue
              placeholder={
                loadingBuildings
                  ? isRtl
                    ? "جاري تحميل المباني..."
                    : "Loading buildings..."
                  : isRtl
                    ? "اختر المبنى"
                    : "Select building"
              }
            />
          </SelectTrigger>

          <SelectContent>
            {buildings.map((building) => (
              <SelectItem key={building.id} value={building.id}>
                {isRtl
                  ? building.name
                  : building.nameEn || building.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedBuildingId && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {isRtl ? "المبنى المحدد:" : "Selected Building:"}
            </span>

            <div className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {(() => {
                const building = buildings.find(
                  (item) => item.id === selectedBuildingId
                );

                return building
                  ? isRtl
                    ? building.name
                    : building.nameEn || building.name
                  : "";
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}