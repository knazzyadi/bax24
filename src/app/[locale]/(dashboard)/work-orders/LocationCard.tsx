// src/app/[locale]/(dashboard)/work-orders/LocationCard.tsx
"use client";

import { useState, useMemo } from "react";
import { Building, Layers, DoorOpen, Plus, X, Search, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
import { BranchSelector } from "@/components/shared/BranchSelector";
import { AssetTypeField } from "@/components/shared/form/AssetTypeField";
import type { WorkOrderFormData } from "./types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// دوال مساعدة للحصول على اسم وكود الأصل (مرنة لمختلف هياكل البيانات)
// ============================================================

function getAssetName(asset: any): string {
  return (
    asset?.name ??
    asset?.assetName ??
    asset?.displayName ??
    asset?.asset?.name ??
    asset?.title ??
    "أصل بدون اسم"
  );
}

function getAssetCode(asset: any): string {
  return (
    asset?.code ??
    asset?.assetCode ??
    asset?.serialNumber ??
    asset?.asset?.code ??
    ""
  );
}

// ============================================================
// الواجهات
// ============================================================

interface LocationCardProps {
  // للنماذج (الإنشاء/التعديل) – اختياري
  formData?: WorkOrderFormData;
  setFormData?: (data: WorkOrderFormData) => void;
  buildings?: any[];
  floors?: any[];
  rooms?: any[];
  locationLevel?: "building" | "floor" | "room";
  setLocationLevel?: (level: "building" | "floor" | "room") => void;
  loadingFloors?: boolean;
  loadingRooms?: boolean;
  isRtl: boolean;
  assetTypes?: any[];
  assets?: any[];
  selectedAssetIds?: string[];
  loadingAssets?: boolean;
  assetDialogOpen?: boolean;
  tempSelectedAssetIds?: string[];
  onOpenAssetDialog?: () => void;
  onConfirmAssetSelection?: () => void;
  onRemoveAsset?: (id: string) => void;
  onTempAssetChange?: (ids: string[]) => void;
  onAssetDialogOpenChange?: (open: boolean) => void;
  isLocationSelected?: boolean;
  t: any;
  // ✅ للعرض فقط (في صفحة التفاصيل) – وضع مضغوط
  room?: any;
  compact?: boolean;
}

// ============================================================
// المكون الرئيسي
// ============================================================

export function LocationCard({
  // للنماذج (اختياري)
  formData,
  setFormData,
  buildings = [],
  floors = [],
  rooms = [],
  locationLevel = "room",
  setLocationLevel = () => {},
  loadingFloors = false,
  loadingRooms = false,
  isRtl,
  assetTypes = [],
  assets = [],
  selectedAssetIds = [],
  loadingAssets = false,
  assetDialogOpen = false,
  tempSelectedAssetIds = [],
  onOpenAssetDialog = () => {},
  onConfirmAssetSelection = () => {},
  onRemoveAsset = () => {},
  onTempAssetChange = () => {},
  onAssetDialogOpenChange = () => {},
  isLocationSelected = false,
  t,
  // ✅ للعرض فقط (وضع مضغوط)
  room,
  compact = false,
}: LocationCardProps) {
  // ✅ استخدام Map لتسريع البحث عن الأصول (في وضع النموذج)
  const assetMap = useMemo(
    () => new Map(assets.map((a) => [a.id, a])),
    [assets]
  );

  // ✅ دالة الحصول على ملخص الموقع للعرض (وضع مضغوط)
  const getLocationSummary = () => {
    if (!room) return isRtl ? "لم يتم تحديد موقع" : "No location set";
    const floor = room.floor;
    const building = floor?.building;
    const parts = [];
    if (building) parts.push(isRtl ? building.name : building.nameEn || building.name);
    if (floor) parts.push(isRtl ? floor.name : floor.nameEn || floor.name);
    parts.push(isRtl ? room.name : room.nameEn || room.name);
    return parts.join(" - ");
  };

  // ✅ إذا كان الوضع مضغوطاً (للعمود الجانبي)
  if (compact && room) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <MapPin className="h-4 w-4 text-indigo-400 shrink-0" />
          <span className="font-medium">{getLocationSummary()}</span>
        </div>
        {room?.floor?.building && (
          <div className="text-xs text-slate-500 dark:text-slate-400 pl-6">
            {isRtl ? "المبنى" : "Building"}: {isRtl ? room.floor.building.name : room.floor.building.nameEn || room.floor.building.name}
          </div>
        )}
      </div>
    );
  }

  // ✅ الوضع الكامل (للنماذج – الإنشاء/التعديل)
  const getSelectedLocationSummary = () => {
    if (locationLevel === "room" && formData?.roomId) {
      const roomItem = rooms.find((r) => r.id === formData.roomId);
      if (roomItem) {
        // ✅ التغيير الأساسي: استخدام room.code و room.name بدلاً من fullCode
        return roomItem.code ? `${roomItem.code} - ${roomItem.name}` : roomItem.name;
      }
      return isRtl ? "غرفة" : "Room";
    }
    if (locationLevel === "floor" && formData?.floorId) {
      const floorItem = floors.find((f) => f.id === formData.floorId);
      return floorItem ? floorItem.name : (isRtl ? "دور" : "Floor");
    }
    if (locationLevel === "building" && formData?.buildingId) {
      const buildingItem = buildings.find((b) => b.id === formData.buildingId);
      return buildingItem ? buildingItem.name : (isRtl ? "مبنى" : "Building");
    }
    return isRtl ? "غير محدد" : "Not selected";
  };

  const isButtonDisabled = !isLocationSelected || !formData?.assetTypeId || assets.length === 0;

  const toggleAssetSelection = (assetId: string) => {
    if (tempSelectedAssetIds.includes(assetId)) {
      onTempAssetChange(tempSelectedAssetIds.filter((id) => id !== assetId));
    } else {
      onTempAssetChange([...tempSelectedAssetIds, assetId]);
    }
  };

  const getLocalizedAssetName = (asset: any) => {
    const name = getAssetName(asset);
    return isRtl ? name : asset?.nameEn || name;
  };

  return (
    <div className="space-y-5">
      {/* الصف الأول: الفرع | المبنى */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Building className="h-4 w-4 text-indigo-400" />
            {isRtl ? "الفرع" : "Branch"}
          </Label>
          <BranchSelector
            value={formData?.branchId || ""}
            onValueChange={(val) => {
              setFormData && setFormData({
                ...formData!,
                branchId: val,
                buildingId: "",
                floorId: "",
                roomId: "",
              });
            }}
            className="w-full"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Building className="h-4 w-4 text-indigo-400" />
            {isRtl ? "المبنى" : "Building"}
          </Label>
          <div className="relative">
            <BuildingSelector
              value={formData?.buildingId ?? ""}
              onValueChange={(val) => {
                setFormData && setFormData({ ...formData!, buildingId: val, floorId: "", roomId: "" });
              }}
              buildings={buildings}
              loading={false}
              className="w-full"
            />
            {!formData?.branchId && (
              <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl cursor-not-allowed z-10" />
            )}
          </div>
        </div>
      </div>

      {/* الصف الثاني: الدور | الغرفة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-400" />
            {isRtl ? "الدور" : "Floor"}
          </Label>
          <FloorSelector
            value={formData?.floorId ?? ""}
            onValueChange={(val) => {
              setFormData && setFormData({ ...formData!, floorId: val, roomId: "" });
            }}
            floors={floors}
            buildingId={formData?.buildingId ?? ""}
            loading={loadingFloors}
            className="w-full"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <DoorOpen className="h-4 w-4 text-indigo-400" />
            {isRtl ? "الغرفة" : "Room"}
          </Label>
          <RoomSelector
            value={formData?.roomId ?? ""}
            onValueChange={(val) => {
              setFormData && setFormData({ ...formData!, roomId: val });
            }}
            rooms={rooms}
            floorId={formData?.floorId ?? ""}
            loading={loadingRooms}
            className="w-full"
          />
        </div>
      </div>

      {/* ملخص الموقع المختار */}
      {isLocationSelected && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {isRtl ? "الموقع المختار:" : "Selected Location:"}
          </span>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {getSelectedLocationSummary()}
          </span>
        </div>
      )}

      {/* الفاصل */}
      <div className="border-t border-slate-200/50 dark:border-slate-800/50 my-4" />

      {/* الصف الثالث: نوع الأصل */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {isRtl ? "نوع الأصل" : "Asset Type"}
        </Label>
        <AssetTypeField
          value={formData?.assetTypeId || ""}
          onChange={(val) => {
            setFormData && setFormData({
              ...formData!,
              assetTypeId: val ?? "",
            });
          }}
          assetTypes={assetTypes}
          disabled={!isLocationSelected}
          placeholder={
            isLocationSelected
              ? isRtl
                ? "اختر نوع الأصل"
                : "Select asset type"
              : isRtl
              ? "اختر الموقع أولاً"
              : "Select location first"
          }
        />
      </div>

      {/* الصف الرابع: اختيار الأصل */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {isRtl ? "اختر الأصل" : "Select Asset"}
        </Label>
        <Button
          type="button"
          variant="outline"
          onClick={onOpenAssetDialog}
          disabled={isButtonDisabled}
          className="w-full justify-start gap-2 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12"
        >
          <Plus className="h-4 w-4" />
          {selectedAssetIds.length > 0
            ? `${selectedAssetIds.length} ${
                isRtl ? "أصل محدد" : "assets selected"
              }`
            : isRtl
            ? "اختر الأصل (اختياري)"
            : "Select asset (optional)"}
        </Button>

        {/* رسالة توضيحية عند التعطيل */}
        {isButtonDisabled && (
          <p className="text-xs text-amber-500 dark:text-amber-400">
            {!isLocationSelected && t("pleaseSelectLocationFirst")}
            {isLocationSelected && !formData?.assetTypeId && t("pleaseSelectAssetType")}
            {isLocationSelected && formData?.assetTypeId && assets.length === 0 && t("noAssetsAvailable")}
          </p>
        )}
      </div>

      {/* عرض الأصول المختارة */}
      {selectedAssetIds.length > 0 && (
        <div className="mt-4 space-y-2">
          {selectedAssetIds.map((assetId) => {
            const asset = assetMap.get(assetId);
            if (!asset) return null;
            return (
              <div
                key={assetId}
                className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30"
              >
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {getLocalizedAssetName(asset)}
                  </p>
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
                    {getAssetCode(asset)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveAsset(assetId)}
                  className="p-1.5 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* حوار اختيار الأصول (Dialog) */}
      <Dialog open={assetDialogOpen} onOpenChange={onAssetDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100 text-xl font-bold">
              {isRtl ? "اختر الأصول" : "Select Assets"}
            </DialogTitle>
          </DialogHeader>

          {loadingAssets ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              {isRtl ? "لا توجد أصول متاحة" : "No assets available"}
            </div>
          ) : (
            <Command className="rounded-lg border border-slate-200/50 dark:border-slate-700/50">
              <CommandInput
                placeholder={isRtl ? "ابحث عن أصل..." : "Search for an asset..."}
                className="h-12"
              />
              <CommandList className="max-h-60 overflow-y-auto">
                <CommandEmpty>
                  {isRtl ? "لا توجد نتائج" : "No results found"}
                </CommandEmpty>
                <CommandGroup>
                  {assets.map((asset) => {
                    const isSelected = tempSelectedAssetIds.includes(asset.id);
                    return (
                      <CommandItem
                        key={asset.id}
                        value={asset.id}
                        onSelect={() => toggleAssetSelection(asset.id)}
                        className="flex items-center gap-3 p-3 cursor-pointer"
                      >
                        <div className="flex h-4 w-4 items-center justify-center rounded border border-slate-300 dark:border-slate-600">
                          {isSelected && (
                            <Check className="h-3 w-3 text-indigo-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {getLocalizedAssetName(asset)}
                          </p>
                          <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
                            {getAssetCode(asset)}
                          </p>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <Button
              variant="outline"
              onClick={() => onAssetDialogOpenChange(false)}
              className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={onConfirmAssetSelection}
              disabled={loadingAssets}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20"
            >
              <Check className="h-4 w-4 mr-2" />
              {isRtl ? "تأكيد" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}