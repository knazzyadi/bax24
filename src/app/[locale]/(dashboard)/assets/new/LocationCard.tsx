// src/app/[locale]/(dashboard)/assets/new/LocationCard.tsx
"use client";

import type { ChangeEvent } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
import {
  MapPin,
  Building as BuildingIcon,
  Layers,
  DoorOpen,
  Settings,
} from "lucide-react";

import type {
  Building,
  Floor,
  Room,
  Branch,
  AssetType,
  AssetStatus,
} from "@/types/assets";

import type { NewAssetFormData } from "./types";

type Translator = (key: string) => string;

interface LocationCardProps {
  branchId: string;
  onBranchChange: (value: string) => void;
  buildingId: string;
  onBuildingChange: (value: string) => void;
  floorId: string;
  onFloorChange: (value: string) => void;
  roomId: string;
  onRoomChange: (value: string) => void;

  branches: Branch[];
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];

  selectedRoomFullCode: string;

  loadingFloors: boolean;
  loadingRooms: boolean;

  formData: NewAssetFormData;

  types: AssetType[];
  statuses: AssetStatus[];

  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;

  handleSelectChange: (field: string, value: string) => void;

  t: Translator;
}

export function LocationCard({
  branchId,
  onBranchChange,
  buildingId,
  onBuildingChange,
  floorId,
  onFloorChange,
  roomId,
  onRoomChange,
  branches,
  buildings,
  floors,
  rooms,
  selectedRoomFullCode,
  loadingFloors,
  loadingRooms,
  formData,
  types,
  statuses,
  handleSelectChange,
  t,
}: LocationCardProps) {
  const normalizeBuilding = (b: Building): Building => ({
    ...b,
    nameEn: b.nameEn ?? undefined,
  });

  const normalizeFloor = (f: Floor): Floor => ({
    ...f,
    nameEn: f.nameEn ?? undefined,
  });

  const normalizeRoom = (r: Room): Room => ({
    ...r,
    nameEn: r.nameEn ?? undefined,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
          <Settings className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>

        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("typeAndLocation")}
        </h2>
      </div>

      <div className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t("type")} <span className="text-rose-500">*</span>
            </Label>

            <Select
              value={formData.typeId}
              onValueChange={(v) => handleSelectChange("typeId", v)}
              disabled={types.length === 0}
            >
              <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4">
                <SelectValue placeholder={t("selectType")} />
              </SelectTrigger>

              <SelectContent position="popper" sideOffset={4}>
                {types.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t("status")}
            </Label>

            <Select
              value={formData.statusId}
              onValueChange={(v) => handleSelectChange("statusId", v)}
              disabled={statuses.length === 0}
            >
              <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4">
                <SelectValue placeholder={t("selectStatus")} />
              </SelectTrigger>

              <SelectContent position="popper" sideOffset={4}>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100">
              {t("locationDetails")}
              <span className="text-rose-500 text-sm ml-1">*</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                <BuildingIcon className="h-4 w-4 text-indigo-400" />
                {t("branch")}
              </Label>

              <Select
                value={branchId}
                onValueChange={onBranchChange}
                disabled={branches.length === 0}
              >
                <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4">
                  <SelectValue placeholder={t("selectBranch")} />
                </SelectTrigger>

                <SelectContent position="popper" sideOffset={4}>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                <BuildingIcon className="h-4 w-4 text-indigo-400" />
                {t("selectBuilding")}
              </Label>

              <BuildingSelector
                className="w-full"
                value={buildingId}
                onValueChange={onBuildingChange}
                buildings={buildings.map(normalizeBuilding)}
                loading={buildings.length === 0 && branchId !== ""}
                placeholder={t("selectBuilding")}
                emptyMessage={t("noBuildings")}
                disabled={!branchId}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                <Layers className="h-4 w-4 text-indigo-400" />
                {t("selectFloor")}
              </Label>

              <FloorSelector
                className="w-full"
                value={floorId}
                onValueChange={onFloorChange}
                floors={floors.map(normalizeFloor)}
                buildingId={buildingId}
                loading={loadingFloors}
                placeholder={t("selectFloor")}
                emptyMessage={t("noFloors")}
                noBuildingMessage={t("selectBuildingFirst")}
                disabled={!buildingId}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                <DoorOpen className="h-4 w-4 text-indigo-400" />
                {t("selectRoom")}
              </Label>

              <RoomSelector
                className="w-full"
                value={roomId}
                onValueChange={onRoomChange}
                rooms={rooms.map(normalizeRoom)}
                floorId={floorId}
                loading={loadingRooms}
                placeholder={t("selectRoom")}
                emptyMessage={t("noRooms")}
                noFloorMessage={t("selectFloorFirst")}
                disabled={!floorId}
              />
            </div>
          </div>

          {selectedRoomFullCode && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-indigo-200/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 p-4 dark:border-indigo-800/30 dark:from-indigo-950/20 dark:to-purple-950/20">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {t("selectedRoom")}
              </span>

              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {selectedRoomFullCode}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}