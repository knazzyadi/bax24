// src/app/[locale]/(dashboard)/maintenance/types.ts

import type { Dispatch, SetStateAction } from "react";

// ============================================================
// إضافة نوع مخصص للتردد (مع التوافق مع القديم)
// ============================================================
export type FrequencyType =
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMI_ANNUAL"
  | "YEARLY"
  | "CUSTOM";

export function isFrequencyType(value: string): value is FrequencyType {
  return (
    value === "MONTHLY" ||
    value === "QUARTERLY" ||
    value === "SEMI_ANNUAL" ||
    value === "YEARLY" ||
    value === "CUSTOM"
  );
}

// ----- أنواع الكيانات الأساسية -----
export interface Building {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

export interface Floor {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  buildingId: string;
}

export interface Room {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  floorId: string;
  buildingId?: string;
  fullCode?: string;
}

export interface AssetType {
  id: string;
  name: string;
  nameEn?: string;
}

export interface Asset {
  id: string;
  name: string;
  code: string;
  nameEn?: string;
}

export type LocationLevel = "building" | "floor" | "room";

// ----- أنواع البيانات المركبة -----
export interface ScheduleDetail {
  id: string;
  name: string;
  frequency: string; // يمكن أن يكون CUSTOM أيضاً، لكن نتركه string للتوافق
  frequencyDays: number;
  leadDays: number;
  startDate: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  branch: Building | null;
  building: Building | null;
  floor: Floor | null;
  room: Room | null;
  locationLevel: string | null;
  assetType: AssetType | null;
  scheduleAssets: { asset: Asset }[];
}

// ✅ تعديل MaintenanceFormData لاستخدام النوع الجديد
export interface MaintenanceFormData {
  name: string;
  frequency: FrequencyType; // الآن هو النوع المحدد
  frequencyDays: number;
  leadDays: number;
  startDate: string;
  assetTypeId: string;
  notes: string;
  isActive: boolean;
}

// ----- أنواع مساعدة -----
export type SetMaintenanceFormData = Dispatch<SetStateAction<MaintenanceFormData>>;
export type TranslateFunction = (key: string) => string;

// ============================================================
// باقي الأنواع (UseMaintenanceFormReturn، UseMaintenanceEditReturn) بدون تغيير
// ============================================================
export interface UseMaintenanceFormReturn {
  formData: MaintenanceFormData;
  setFormData: SetMaintenanceFormData;
  branchId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  assetTypes: AssetType[];
  assets: Asset[];
  selectedAssetIds: string[];
  tempSelectedAssetIds: string[];
  loadingBuildings: boolean;
  loadingFloors: boolean;
  loadingRooms: boolean;
  loadingAssetTypes: boolean;
  loadingAssets: boolean;
  dataLoaded: boolean;
  isSubmitting: boolean;
  assetDialogOpen: boolean;

  // دوال تعديل النموذج
  handleNameChange: (value: string) => void;
  handleFrequencyChange: (value: string) => void; // تستقبل string لكنها تتوقع FrequencyType
  handleLeadDaysChange: (value: number) => void;
  handleFrequencyDaysChange: (value: number) => void;
  handleStartDateChange: (value: string) => void;
  handleIsActiveChange: (value: boolean) => void;
  handleNotesChange: (value: string) => void;
  handleAssetTypeChange: (val: string | null) => void;

  setBranchId: (val: string) => void;
  setBuildingId: (val: string) => void;
  setFloorId: (val: string) => void;
  setRoomId: (val: string) => void;

  setSelectedAssetIds: Dispatch<SetStateAction<string[]>>;
  setTempSelectedAssetIds: Dispatch<SetStateAction<string[]>>;
  openAssetDialog: () => void;
  closeAssetDialog: () => void;
  confirmAssetSelection: () => void;
  removeAsset: (assetId: string) => void;

  handleSubmit: () => Promise<void>;
  getSelectedLocationSummary: () => string;
  isLocationSelected: () => boolean;
}

export interface UseMaintenanceEditReturn {
  formData: MaintenanceFormData;
  setFormData: SetMaintenanceFormData;
  branchId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  assetTypes: AssetType[];
  assets: Asset[];
  selectedAssetIds: string[];
  tempSelectedAssetIds: string[];
  loading: boolean;
  loadingFloors: boolean;
  loadingRooms: boolean;
  loadingAssetTypes: boolean;
  loadingAssets: boolean;
  isSubmitting: boolean;
  assetDialogOpen: boolean;

  handleNameChange: (value: string) => void;
  handleFrequencyChange: (value: string) => void;
  handleLeadDaysChange: (value: number) => void;
  handleFrequencyDaysChange: (value: number) => void;
  handleStartDateChange: (value: string) => void;
  handleIsActiveChange: (value: boolean) => void;
  handleNotesChange: (value: string) => void;
  handleAssetTypeChange: (val: string | null) => void;

  setBranchId: (val: string) => void;
  setBuildingId: (val: string) => void;
  setFloorId: (val: string) => void;
  setRoomId: (val: string) => void;

  setSelectedAssetIds: Dispatch<SetStateAction<string[]>>;
  setTempSelectedAssetIds: Dispatch<SetStateAction<string[]>>;
  openAssetDialog: () => void;
  closeAssetDialog: () => void;
  confirmAssetSelection: () => void;
  removeAsset: (assetId: string) => void;

  handleSubmit: () => Promise<void>;
  getSelectedLocationSummary: () => string;
  isLocationSelected: () => boolean;
}