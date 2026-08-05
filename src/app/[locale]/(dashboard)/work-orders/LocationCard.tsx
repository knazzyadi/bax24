// src/app/[locale]/(dashboard)/work-orders/LocationCard.tsx

"use client";

import { useMemo } from "react";
import {
  Building,
  Layers,
  DoorOpen,
  Plus,
  X,
  MapPin,
  Check,
} from "lucide-react";
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

// ============================================================
// الأنواع (معدلة لدعم null)
// ============================================================

interface AssetOption {
  id: string;
  name?: string;
  nameEn?: string | null;
  code?: string | null;
  assetName?: string;
  displayName?: string;
  assetCode?: string;
  serialNumber?: string;
  asset?: {
    name?: string;
    code?: string;
  };
  title?: string;
}

interface LocationOption {
  id: string;
  name: string;
  nameEn?: string | null;  // ✅ دعم null
  code?: string | null;    // ✅ دعم null
}

interface BuildingOption extends LocationOption {
  branchId?: string;
}

interface FloorOption extends LocationOption {
  buildingId: string;
}

interface LocationRoom extends LocationOption {
  floorId: string;
  floor?: {
    name: string;
    nameEn?: string | null;
    building?: {
      name: string;
      nameEn?: string | null;
    };
  };
}

// ============================================================
// دوال مساعدة
// ============================================================

function getAssetName(asset: AssetOption): string {
  return (
    asset.name ??
    asset.assetName ??
    asset.displayName ??
    asset.asset?.name ??
    asset.title ??
    "أصل بدون اسم"
  );
}

function getAssetCode(asset: AssetOption): string {
  return (
    asset.code ??
    asset.assetCode ??
    asset.serialNumber ??
    asset.asset?.code ??
    ""
  );
}

// ============================================================
// واجهة Props (تستقبل البيانات مع null)
// ============================================================

interface LocationCardProps {
  formData?: WorkOrderFormData;
  setFormData?: (data: WorkOrderFormData) => void;

  buildings?: BuildingOption[];
  floors?: FloorOption[];
  rooms?: LocationRoom[];

  loadingFloors?: boolean;
  loadingRooms?: boolean;

  isRtl: boolean;

  assetTypes?: LocationOption[];
  assets?: AssetOption[];

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

  t: (key: string) => string;

  room?: LocationRoom;

  compact?: boolean;
}

// ============================================================
// المكون الرئيسي
// ============================================================

export function LocationCard({
  formData,
  setFormData,
  buildings = [],
  floors = [],
  rooms = [],
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
  isLocationSelected: propIsLocationSelected = false,
  t,
  room,
  compact = false,
}: LocationCardProps) {
  // ============================================================
  // تحويل البيانات لتتوافق مع المكونات الفرعية (إزالة null)
  // ============================================================

  const buildingsForSelector = useMemo(
    () =>
      buildings.map((b) => ({
        id: b.id,
        name: b.name,
        nameEn: b.nameEn ?? undefined,
        code: b.code ?? undefined,
        branchId: b.branchId,
      })),
    [buildings]
  );

  const floorsForSelector = useMemo(
    () =>
      floors.map((f) => ({
        id: f.id,
        name: f.name,
        nameEn: f.nameEn ?? undefined,
        code: f.code ?? undefined,
        buildingId: f.buildingId,
      })),
    [floors]
  );

  const roomsForSelector = useMemo(
    () =>
      rooms.map((r) => ({
        id: r.id,
        name: r.name,
        nameEn: r.nameEn ?? undefined,
        code: r.code ?? undefined,
        floorId: r.floorId,
      })),
    [rooms]
  );

  const assetMap = useMemo(
    () => new Map(assets.map((a) => [a.id, a])),
    [assets]
  );

  const isLocationSelected = formData
    ? !!(formData.buildingId && formData.floorId)
    : propIsLocationSelected;

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

  // وضع مضغوط (للعرض الجانبي)
  if (compact && room) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <MapPin className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
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

  const getSelectedLocationSummary = () => {
    if (formData?.roomId) {
      const roomItem = rooms.find((r) => r.id === formData.roomId);
      if (roomItem) {
        return roomItem.code ? `${roomItem.code} - ${roomItem.name}` : roomItem.name;
      }
      return isRtl ? "غرفة" : "Room";
    }
    if (formData?.floorId) {
      const floorItem = floors.find((f) => f.id === formData.floorId);
      return floorItem ? floorItem.name : (isRtl ? "دور" : "Floor");
    }
    if (formData?.buildingId) {
      const buildingItem = buildings.find((b) => b.id === formData.buildingId);
      return buildingItem ? buildingItem.name : (isRtl ? "مبنى" : "Building");
    }
    return isRtl ? "غير محدد" : "Not selected";
  };

  const isAssetSelectionEnabled = isLocationSelected && !!formData?.assetTypeId && assets.length > 0;

  const toggleAssetSelection = (assetId: string) => {
    if (tempSelectedAssetIds.includes(assetId)) {
      onTempAssetChange(tempSelectedAssetIds.filter((id) => id !== assetId));
    } else {
      onTempAssetChange([...tempSelectedAssetIds, assetId]);
    }
  };

  const getLocalizedAssetName = (asset: AssetOption) => {
    const name = getAssetName(asset);
    return isRtl ? name : asset.nameEn || name;
  };

  // ========== التصميم ==========

  return (
    <div className="space-y-6">
      {/* الصف الأول: الفرع | المبنى */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Building className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            {isRtl ? "الفرع" : "Branch"}
          </Label>
          <BranchSelector
            value={formData?.branchId || ""}
            onValueChange={(val) => {
              // ✅ استبدال && بـ if
              if (setFormData) {
                setFormData({
                  ...formData!,
                  branchId: val,
                  buildingId: "",
                  floorId: "",
                  roomId: "",
                });
              }
            }}
            className="w-full"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Building className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            {isRtl ? "المبنى" : "Building"}
          </Label>
          <div className="relative">
            <BuildingSelector
              value={formData?.buildingId ?? ""}
              onValueChange={(val) => {
                // ✅ استبدال && بـ if
                if (setFormData) {
                  setFormData({
                    ...formData!,
                    buildingId: val,
                    floorId: "",
                    roomId: "",
                  });
                }
              }}
              buildings={buildingsForSelector}
              loading={false}
              className="w-full"
            />
            {!formData?.branchId && (
              <div className="absolute inset-0 bg-slate-100/60 dark:bg-slate-900/60 rounded-xl cursor-not-allowed z-10" />
            )}
          </div>
        </div>
      </div>

      {/* الصف الثاني: الدور | الغرفة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            {isRtl ? "الدور" : "Floor"}
          </Label>
          <FloorSelector
            value={formData?.floorId ?? ""}
            onValueChange={(val) => {
              // ✅ استبدال && بـ if
              if (setFormData) {
                setFormData({
                  ...formData!,
                  floorId: val,
                  roomId: "",
                });
              }
            }}
            floors={floorsForSelector}
            buildingId={formData?.buildingId ?? ""}
            loading={loadingFloors}
            className="w-full"
            isRtl={isRtl}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <DoorOpen className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            {isRtl ? "الغرفة (اختياري)" : "Room (optional)"}
          </Label>
          <RoomSelector
            value={formData?.roomId ?? ""}
            onValueChange={(val) => {
              // ✅ استبدال && بـ if
              if (setFormData) {
                setFormData({
                  ...formData!,
                  roomId: val,
                });
              }
            }}
            rooms={roomsForSelector}
            floorId={formData?.floorId ?? ""}
            loading={loadingRooms}
            className="w-full"
            placeholder={isRtl ? "اختر غرفة (اختياري)" : "Select room (optional)"}
            isRtl={isRtl}
          />
          {formData?.floorId && !formData?.roomId && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5 font-medium">
              {isRtl ? "💡 سيتم تطبيق أمر العمل على الدور بالكامل" : "💡 Work order will apply to the entire floor"}
            </p>
          )}
        </div>
      </div>

      {/* ملخص الموقع المختار */}
      {isLocationSelected && (
        <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {isRtl ? "الموقع المختار:" : "Selected Location:"}
          </span>
          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
            {getSelectedLocationSummary()}
            {formData?.roomId ? "" : (isRtl ? " (الدور كامل)" : " (Entire floor)")}
          </span>
        </div>
      )}

      <div className="border-t border-slate-200/60 dark:border-slate-700/60 my-4" />

      {/* نوع الأصل */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {isRtl ? "نوع الأصل" : "Asset Type"}
        </Label>
        <AssetTypeField
          value={formData?.assetTypeId || ""}
          onChange={(val) => {
            // ✅ استبدال && بـ if
            if (setFormData) {
              setFormData({
                ...formData!,
                assetTypeId: val ?? "",
              });
            }
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
          isRtl={isRtl}
          className="w-full"
        />
      </div>

      {/* اختيار الأصل */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {isRtl ? "اختر الأصل" : "Select Asset"}
        </Label>
        <Button
          type="button"
          variant="outline"
          onClick={onOpenAssetDialog}
          disabled={!isAssetSelectionEnabled}
          className="w-full justify-start gap-3 rounded-xl border-slate-300 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 h-12 font-medium transition-all"
        >
          <Plus className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          {selectedAssetIds && selectedAssetIds.length > 0
            ? `${selectedAssetIds.length} ${
                isRtl ? "أصل محدد" : "assets selected"
              }`
            : isRtl
            ? "اختر الأصل (اختياري)"
            : "Select asset (optional)"}
        </Button>

        {!isAssetSelectionEnabled && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            {!isLocationSelected && t("pleaseSelectLocationFirst")}
            {isLocationSelected && !formData?.assetTypeId && t("pleaseSelectAssetType")}
            {isLocationSelected && formData?.assetTypeId && assets.length === 0 && t("noAssetsAvailable")}
          </p>
        )}
      </div>

      {/* عرض الأصول المختارة */}
      {selectedAssetIds && selectedAssetIds.length > 0 && (
        <div className="mt-4 space-y-2">
          {selectedAssetIds.map((assetId) => {
            const asset = assetMap.get(assetId);
            if (!asset) return null;
            return (
              <div
                key={assetId}
                className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/40"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {getLocalizedAssetName(asset)}
                  </p>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
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

      {/* حوار اختيار الأصول */}
      <Dialog open={assetDialogOpen} onOpenChange={onAssetDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100 text-xl font-bold">
              {isRtl ? "اختر الأصول" : "Select Assets"}
            </DialogTitle>
          </DialogHeader>

          {loadingAssets ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent dark:border-indigo-400" />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              {isRtl ? "لا توجد أصول متاحة" : "No assets available"}
            </div>
          ) : (
            <Command className="rounded-lg border border-slate-200/60 dark:border-slate-700/60">
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
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30"
                      >
                        <div className="flex h-4 w-4 items-center justify-center rounded border border-slate-300 dark:border-slate-600">
                          {isSelected && (
                            <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {getLocalizedAssetName(asset)}
                          </p>
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
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

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
            <Button
              variant="outline"
              onClick={() => onAssetDialogOpenChange(false)}
              className="rounded-xl border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={onConfirmAssetSelection}
              disabled={loadingAssets}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium shadow-md hover:shadow-lg transition-all"
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