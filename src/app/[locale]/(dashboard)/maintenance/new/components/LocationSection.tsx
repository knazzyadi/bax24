// LocationSection.tsx
"use client";

import { Label } from "@/components/ui/label";
import { MapPin, Building, Layers, DoorOpen } from "lucide-react";
import { BranchSelector } from "@/components/shared/BranchSelector";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";

interface LocationSectionProps {
  branchId: string;
  setBranchId: (val: string) => void;
  buildingId: string;
  setBuildingId: (val: string) => void;
  floorId: string;
  setFloorId: (val: string) => void;
  roomId: string;
  setRoomId: (val: string) => void;
  locationLevel: "building" | "floor" | "room";
  setLocationLevel: (val: "building" | "floor" | "room") => void;
  buildings: any[];
  floors: any[];
  rooms: any[];
  loadingBuildings: boolean;
  loadingFloors: boolean;
  loadingRooms: boolean;
  isRtl: boolean;
  t: any;
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
  locationLevel,
  setLocationLevel,
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
          <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isRtl ? "تفاصيل الموقع" : "Location Details"}
          <span className="text-rose-500 text-sm ml-1">*</span>
        </h2>
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap gap-4 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-700/30">
          {["building", "floor", "room"].map((level) => (
            <label key={level} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={level}
                checked={locationLevel === level}
                onChange={() => setLocationLevel(level as any)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {level === "building"
                  ? isRtl ? "مبنى" : "Building"
                  : level === "floor"
                  ? isRtl ? "دور" : "Floor"
                  : isRtl ? "غرفة" : "Room"}
              </span>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Building className="h-4 w-4 text-indigo-400" />
              {isRtl ? "الفرع" : "Branch"}
            </Label>
            <BranchSelector
              value={branchId}
              onValueChange={(val) => {
                setBranchId(val);
                setBuildingId("");
                setFloorId("");
                setRoomId("");
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Building className="h-4 w-4 text-indigo-400" />
              {isRtl ? "المبنى أو المنطقة" : "Building / Zone"}
            </Label>
            <div className="relative">
              <BuildingSelector
                value={buildingId}
                onValueChange={(val) => {
                  setBuildingId(val);
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

          {(locationLevel === "floor" || locationLevel === "room") && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-400" />
                {isRtl ? "الدور أو المنطقة" : "Floor / Zone"}
              </Label>
              <FloorSelector
                value={floorId}
                onValueChange={(val) => {
                  setFloorId(val);
                  setRoomId("");
                }}
                floors={floors}
                buildingId={buildingId}
                loading={loadingFloors}
              />
            </div>
          )}

          {locationLevel === "room" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <DoorOpen className="h-4 w-4 text-indigo-400" />
                {isRtl ? "الوحدة" : "Unit"}
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