// src/app/[locale]/(dashboard)/maintenance/LocationSection.tsx
"use client";

import { Label } from "@/components/ui/label";
import {
  MapPin as MapPinIcon,
  Building as BuildingIcon,
  Layers as LayersIcon,
  DoorOpen as DoorOpenIcon,
} from "lucide-react";
import { BranchSelector } from "@/components/shared/BranchSelector";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
import type {
  Building,
  Floor,
  Room,
} from "./types";

interface LocationSectionProps {
  branchId: string;
  setBranchId: (val: string) => void;
  buildingId: string;
  setBuildingId: (val: string) => void;
  floorId: string;
  setFloorId: (val: string) => void;
  roomId: string;
  setRoomId: (val: string) => void;
  // ✅ تم حذف locationLevel و setLocationLevel
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  loadingBuildings: boolean;
  loadingFloors: boolean;
  loadingRooms: boolean;
  isRtl: boolean;
  t: (key: string) => string;
  getSelectedLocationSummary: () => string;
  isLocationSelected: () => boolean;
}

export function LocationSection({
  branchId,
  setBranchId,
  buildingId,
  setBuildingId,
  floorId,
  setFloorId,
  roomId,
  setRoomId,
  // ✅ تم حذف locationLevel و setLocationLevel من الـ destructuring
  buildings,
  floors,
  rooms,
  loadingBuildings,
  loadingFloors,
  loadingRooms,
  isRtl,
  t,
  getSelectedLocationSummary,
  isLocationSelected,
}: LocationSectionProps) {
  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
          <MapPinIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("location")} <span className="text-rose-500">*</span>
        </h2>
      </div>

      <div className="space-y-5">
        {/* شبكة المحددات - ترتيب هرمي: فرع ← مبنى ← دور ← غرفة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* الفرع */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <BuildingIcon className="h-4 w-4 text-indigo-400" />
              {t("branch")}
            </Label>
            <BranchSelector
              value={branchId}
              onValueChange={(val) => {
                setBranchId(val);
                // عند تغيير الفرع، نمسح المبنى والدور والغرفة
                setBuildingId("");
                setFloorId("");
                setRoomId("");
              }}
            />
          </div>

          {/* المبنى */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <BuildingIcon className="h-4 w-4 text-indigo-400" />
              {t("building")}
            </Label>
            <div className="relative">
              <BuildingSelector
                value={buildingId}
                onValueChange={(val) => {
                  setBuildingId(val);
                  // عند تغيير المبنى، نمسح الدور والغرفة
                  setFloorId("");
                  setRoomId("");
                }}
                buildings={buildings}
                loading={loadingBuildings}
              />
              {!branchId && (
                <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl cursor-not-allowed z-10" />
              )}
            </div>
          </div>

          {/* الدور - يظهر فقط إذا تم اختيار مبنى */}
          {buildingId && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <LayersIcon className="h-4 w-4 text-indigo-400" />
                {t("floor")}
              </Label>
              <FloorSelector
                value={floorId}
                onValueChange={(val) => {
                  setFloorId(val);
                  // عند تغيير الدور، نمسح الغرفة
                  setRoomId("");
                }}
                floors={floors}
                buildingId={buildingId}
                loading={loadingFloors}
              />
            </div>
          )}

          {/* الغرفة - تظهر فقط إذا تم اختيار دور */}
          {floorId && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <DoorOpenIcon className="h-4 w-4 text-indigo-400" />
                {t("room")}
              </Label>
              <RoomSelector
                value={roomId}
                onValueChange={setRoomId}
                rooms={rooms}
                floorId={floorId}
                loading={loadingRooms}
              />
            </div>
          )}
        </div>

        {/* ملخص الموقع المحدد */}
        {isLocationSelected() && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {isRtl ? "الموقع المختار:" : "Selected Location:"}
            </span>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {getSelectedLocationSummary()}
            </span>
          </div>
        )}
      </div>
    </>
  );
}