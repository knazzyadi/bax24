// src/app/[locale]/(dashboard)/assets/bulk-import/components/LocationSelector.tsx
"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Building, Floor, Room } from "@/types/assets";

interface LocationSelectorProps {
  buildings: Building[];
  floors: Floor[];
  rooms: (Room & { fullCode?: string })[];
  selectedBuildingId: string;
  selectedFloorId: string;
  selectedRoomId: string;
  selectedRoomCode?: string;
  selectedRoomName?: string;
  loadingBuildings: boolean;
  loadingFloors: boolean;
  loadingRooms: boolean;
  onBuildingChange: (id: string) => void;
  onFloorChange: (id: string) => void;
  onRoomChange: (id: string) => void;
  isRtl: boolean;
}

export function LocationSelector({
  buildings,
  floors,
  rooms,
  selectedBuildingId,
  selectedFloorId,
  selectedRoomId,
  selectedRoomCode,
  selectedRoomName,
  loadingBuildings,
  loadingFloors,
  loadingRooms,
  onBuildingChange,
  onFloorChange,
  onRoomChange,
  isRtl,
}: LocationSelectorProps) {
  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium">
            {isRtl ? "المبنى" : "Building"}
          </Label>
          <Select
            value={selectedBuildingId}
            onValueChange={onBuildingChange}
            disabled={loadingBuildings}
          >
            <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800">
              <SelectValue
                placeholder={
                  loadingBuildings
                    ? isRtl ? "جاري التحميل..." : "Loading..."
                    : isRtl ? "اختر المبنى" : "Select building"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {buildings.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {isRtl ? b.name : b.nameEn || b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium">
            {isRtl ? "الدور" : "Floor"}
          </Label>
          <Select
            value={selectedFloorId}
            onValueChange={onFloorChange}
            disabled={!selectedBuildingId || loadingFloors}
          >
            <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800">
              <SelectValue
                placeholder={
                  loadingFloors
                    ? isRtl ? "جاري التحميل..." : "Loading..."
                    : !selectedBuildingId
                    ? isRtl ? "اختر المبنى أولاً" : "Select building first"
                    : isRtl ? "اختر الدور" : "Select floor"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {floors.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {isRtl ? f.name : f.nameEn || f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium">
            {isRtl ? "الغرفة" : "Room"}
          </Label>
          <Select
            value={selectedRoomId}
            onValueChange={onRoomChange}
            disabled={!selectedFloorId || loadingRooms}
          >
            <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800">
              <SelectValue
                placeholder={
                  loadingRooms
                    ? isRtl ? "جاري التحميل..." : "Loading..."
                    : !selectedFloorId
                    ? isRtl ? "اختر الدور أولاً" : "Select floor first"
                    : isRtl ? "اختر الغرفة" : "Select room"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {isRtl ? r.name : r.nameEn || r.name}
                  {r.fullCode && ` (${r.fullCode})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {selectedRoomCode && (
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {isRtl ? "الموقع المختار:" : "Selected Location:"}
          </span>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {selectedRoomName} — {selectedRoomCode}
          </span>
        </div>
      )}
    </div>
  );
}