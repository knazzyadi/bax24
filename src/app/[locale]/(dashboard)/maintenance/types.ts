// src/app/[locale]/(dashboard)/maintenance/types.ts

import type { Dispatch, SetStateAction } from "react";

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

// ✅ تم الإبقاء على LocationLevel لأنه قد يستخدم في مكان آخر (مثلاً في عرض التفاصيل)
export type LocationLevel = "building" | "floor" | "room";

// ----- أنواع البيانات المركبة -----
export interface ScheduleDetail {
  id: string;
  name: string;
  frequency: string;
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
  locationLevel: string | null; // يبقى لأن قاعدة البيانات تحتويه
  assetType: AssetType | null;
  scheduleAssets: { asset: Asset }[];
}

export interface MaintenanceFormData {
  name: string;
  frequency: string;
  frequencyDays: number;
  leadDays: number;
  startDate: string;
  assetTypeId: string;
  notes: string;
  isActive: boolean;
}

// ----- أنواع مساعدة (للدوال) -----
export type SetMaintenanceFormData = Dispatch<SetStateAction<MaintenanceFormData>>;
export type TranslateFunction = (key: string) => string;

// ============================================================
// ✅ UseMaintenanceFormReturn (مطابق للـ Hook المعدل)
// ============================================================
export interface UseMaintenanceFormReturn {
  // البيانات الأساسية
  formData: MaintenanceFormData;
  setFormData: SetMaintenanceFormData;

  // المعرفات
  branchId: string;
  buildingId: string;
  floorId: string;
  roomId: string;

  // القوائم
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  assetTypes: AssetType[];
  assets: Asset[];
  selectedAssetIds: string[];
  tempSelectedAssetIds: string[];

  // حالات التحميل
  loadingBuildings: boolean;
  loadingFloors: boolean;
  loadingRooms: boolean;
  loadingAssetTypes: boolean;
  loadingAssets: boolean;
  dataLoaded: boolean;
  isSubmitting: boolean;
  assetDialogOpen: boolean;

  // ✅ دوال تعديل النموذج (مضافة حديثاً)
  handleNameChange: (value: string) => void;
  handleFrequencyChange: (value: string) => void;
  handleLeadDaysChange: (value: number) => void;
  handleFrequencyDaysChange: (value: number) => void;
  handleStartDateChange: (value: string) => void;
  handleIsActiveChange: (value: boolean) => void;
  handleNotesChange: (value: string) => void;
  handleAssetTypeChange: (val: string | null) => void;

  // دوال تحديث المعرفات
  setBranchId: (val: string) => void;
  setBuildingId: (val: string) => void;
  setFloorId: (val: string) => void;
  setRoomId: (val: string) => void;

  // دوال الأصول
  setSelectedAssetIds: Dispatch<SetStateAction<string[]>>;
  setTempSelectedAssetIds: Dispatch<SetStateAction<string[]>>;
  openAssetDialog: () => void;
  closeAssetDialog: () => void;
  confirmAssetSelection: () => void;
  removeAsset: (assetId: string) => void;

  // دوال مساعدة
  handleSubmit: () => Promise<void>;
  getSelectedLocationSummary: () => string;
  isLocationSelected: () => boolean;
}

// ============================================================
// ✅ UseMaintenanceEditReturn (مطابق للـ Hook المعدل)
// ============================================================
export interface UseMaintenanceEditReturn {
  // البيانات الأساسية
  formData: MaintenanceFormData;
  setFormData: SetMaintenanceFormData;

  // المعرفات
  branchId: string;
  buildingId: string;
  floorId: string;
  roomId: string;

  // القوائم
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  assetTypes: AssetType[];
  assets: Asset[];
  selectedAssetIds: string[];
  tempSelectedAssetIds: string[];

  // حالات التحميل
  loading: boolean;
  loadingFloors: boolean;
  loadingRooms: boolean;
  loadingAssetTypes: boolean; // ✅ تمت الإضافة
  loadingAssets: boolean;
  isSubmitting: boolean;
  assetDialogOpen: boolean;

  // ✅ دوال تعديل النموذج (مضافة حديثاً للاتساق)
  handleNameChange: (value: string) => void;
  handleFrequencyChange: (value: string) => void;
  handleLeadDaysChange: (value: number) => void;
  handleFrequencyDaysChange: (value: number) => void;
  handleStartDateChange: (value: string) => void;
  handleIsActiveChange: (value: boolean) => void;
  handleNotesChange: (value: string) => void;
  handleAssetTypeChange: (val: string | null) => void;

  // دوال تحديث المعرفات
  setBranchId: (val: string) => void;
  setBuildingId: (val: string) => void;
  setFloorId: (val: string) => void;
  setRoomId: (val: string) => void;

  // دوال الأصول
  setSelectedAssetIds: Dispatch<SetStateAction<string[]>>;
  setTempSelectedAssetIds: Dispatch<SetStateAction<string[]>>;
  openAssetDialog: () => void;
  closeAssetDialog: () => void;
  confirmAssetSelection: () => void;
  removeAsset: (assetId: string) => void;

  // دوال مساعدة
  handleSubmit: () => Promise<void>;
  getSelectedLocationSummary: () => string;
  isLocationSelected: () => boolean;
}