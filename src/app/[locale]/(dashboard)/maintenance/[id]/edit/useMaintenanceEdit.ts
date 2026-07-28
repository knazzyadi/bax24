// src/app/[locale]/(dashboard)/maintenance/[id]/edit/useMaintenanceEdit.ts
"use client";

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type {
  Building,
  Floor,
  Room,
  AssetType,
  Asset,
  MaintenanceFormData,
  UseMaintenanceEditReturn,
} from "../../types";
import { frequencyStringToDays } from "../../utils";

interface UseMaintenanceEditProps {
  id: string;
}

export function useMaintenanceEdit({ id }: UseMaintenanceEditProps): UseMaintenanceEditReturn {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("MaintenanceForm");

  // ===== State =====
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(false);

  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  const [branchId, setBranchId] = useState<string>("");
  const [buildingId, setBuildingId] = useState<string>("");
  const [floorId, setFloorId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [tempSelectedAssetIds, setTempSelectedAssetIds] = useState<string[]>([]);

  const [formData, setFormData] = useState<MaintenanceFormData>({
    name: "",
    frequency: "MONTHLY",
    frequencyDays: 30,
    leadDays: 30,
    startDate: "",
    assetTypeId: "",
    notes: "",
    isActive: true,
  });

  // ============================================================
  // دوال التحديث المحددة لـ formData (لتوفير واجهة نظيفة)
  // ============================================================
  const handleNameChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, name: value }));
  }, []);

  const handleFrequencyChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, frequency: value }));
  }, []);

  const handleLeadDaysChange = useCallback((value: number) => {
    setFormData((prev) => ({ ...prev, leadDays: value }));
  }, []);

  const handleFrequencyDaysChange = useCallback((value: number) => {
    setFormData((prev) => ({ ...prev, frequencyDays: value }));
  }, []);

  const handleStartDateChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, startDate: value }));
  }, []);

  const handleNotesChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, notes: value }));
  }, []);

  const handleIsActiveChange = useCallback((value: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: value }));
  }, []);

  // ============================================================
  // 1. جلب البيانات (مرة واحدة عند التحميل)
  // ============================================================
  useEffect(() => {
    async function fetchEditData() {
      try {
        const [scheduleRes, assetTypesRes] = await Promise.all([
          fetch(`/api/maintenance/schedules/${id}`),
          fetch("/api/asset-types", { cache: "no-store" }),
        ]);

        if (!scheduleRes.ok) throw new Error("فشل جلب بيانات الجدول");
        if (assetTypesRes.ok) {
          const types = await assetTypesRes.json();
          setAssetTypes(types);
        }

        const data = await scheduleRes.json();

        setFormData({
          name: data.name || "",
          frequency: data.frequency || "MONTHLY",
          frequencyDays: data.frequencyDays || frequencyStringToDays(data.frequency),
          leadDays: data.leadDays || 30,
          startDate: data.startDate?.split("T")[0] || "",
          assetTypeId: data.assetTypeId || "",
          notes: data.notes || "",
          isActive: data.isActive ?? true,
        });

        setBranchId(data.branchId || "");
        setBuildingId(data.buildingId || "");
        setFloorId(data.floorId || "");
        setRoomId(data.roomId || "");

        const assetIds = data.scheduleAssets?.map((a: any) => a.asset.id) || [];
        setSelectedAssetIds(assetIds);
        setTempSelectedAssetIds(assetIds);

        await loadLocationData(data.branchId, data.buildingId, data.floorId);

        if (data.assetTypeId) {
          await loadAssetsForLocation(
            data.assetTypeId,
            data.branchId,
            data.buildingId,
            data.floorId,
            data.roomId
          );
        }
      } catch (error) {
        console.error("Error fetching edit data:", error);
        toast.error(t("fetchError") || "فشل تحميل بيانات الجدول");
        router.push(`/${locale}/maintenance`);
      } finally {
        setLoading(false);
      }
    }

    fetchEditData();
  }, [id, locale, router, t]);

  // ============================================================
  // 2. تحميل بيانات الموقع
  // ============================================================
  const loadLocationData = async (
    branchId: string,
    buildingId: string,
    floorId: string
  ) => {
    try {
      const buildingsUrl = `/api/locations/buildings${branchId ? `?branchId=${branchId}` : ""}`;
      const buildingsRes = await fetch(buildingsUrl);
      if (buildingsRes.ok) {
        const buildingsData = await buildingsRes.json();
        setBuildings(buildingsData);
      }

      if (buildingId) {
        const floorsRes = await fetch(`/api/locations/buildings/${buildingId}/floors`);
        if (floorsRes.ok) {
          const floorsData = await floorsRes.json();
          setFloors(floorsData);
        }
      }

      if (floorId) {
        const roomsRes = await fetch(`/api/locations/floors/${floorId}/rooms`);
        if (roomsRes.ok) {
          const roomsData = await roomsRes.json();
          setRooms(roomsData);
        }
      }
    } catch (error) {
      console.error("Error loading location data:", error);
    }
  };

  // ============================================================
  // 3. تحميل الأصول حسب الموقع
  // ============================================================
  const loadAssetsForLocation = async (
    assetTypeId: string,
    branchId: string,
    buildingId: string,
    floorId: string,
    roomId: string
  ) => {
    if (!assetTypeId) return;

    const params = new URLSearchParams();
    params.append("typeId", assetTypeId);
    if (branchId) params.append("branchId", branchId);
    if (buildingId) params.append("buildingId", buildingId);
    if (floorId) params.append("floorId", floorId);
    if (roomId) params.append("roomId", roomId);

    try {
      const res = await fetch(`/api/assets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error("Error loading assets:", error);
    }
  };

  // ============================================================
  // 4. تأثيرات التغيير
  // ============================================================
  useEffect(() => {
    if (!buildingId) {
      setFloors([]);
      return;
    }

    const controller = new AbortController();
    setLoadingFloors(true);

    async function fetchFloorsData() {
      try {
        const res = await fetch(`/api/locations/buildings/${buildingId}/floors`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setFloors(Array.isArray(data) ? data : []);
        } else {
          setFloors([]);
        }
      } catch {
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    }

    fetchFloorsData();
    return () => controller.abort();
  }, [buildingId]);

  useEffect(() => {
    if (!floorId) {
      setRooms([]);
      return;
    }

    const controller = new AbortController();
    setLoadingRooms(true);

    async function fetchRoomsData() {
      try {
        const res = await fetch(`/api/locations/floors/${floorId}/rooms`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setRooms(Array.isArray(data) ? data : []);
        } else {
          setRooms([]);
        }
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    }

    fetchRoomsData();
    return () => controller.abort();
  }, [floorId]);

  useEffect(() => {
    if (!branchId) {
      setBuildings([]);
      return;
    }

    const controller = new AbortController();

    async function fetchBuildingsData() {
      try {
        const res = await fetch(`/api/locations/buildings?branchId=${branchId}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setBuildings(data);
        } else {
          setBuildings([]);
        }
      } catch {
        setBuildings([]);
      }
    }

    fetchBuildingsData();
    return () => controller.abort();
  }, [branchId]);

  // ============================================================
  // ✅ تحميل الأصول - مطابق لسلوك صفحة الإنشاء
  // ============================================================
  useEffect(() => {
    if (!formData.assetTypeId) {
      setAssets([]);
      return;
    }

    if (!buildingId && !floorId && !roomId) {
      setAssets([]);
      return;
    }

    const params = new URLSearchParams();
    params.append("typeId", formData.assetTypeId);
    if (branchId) params.append("branchId", branchId);
    if (buildingId) params.append("buildingId", buildingId);
    if (floorId) params.append("floorId", floorId);
    if (roomId) params.append("roomId", roomId);

    const controller = new AbortController();
    setLoadingAssets(true);

    async function fetchAssetsData() {
      try {
        const res = await fetch(`/api/assets?${params.toString()}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setAssets(data.assets || []);
        } else {
          setAssets([]);
        }
      } catch {
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    }

    fetchAssetsData();
    return () => controller.abort();
  }, [formData.assetTypeId, buildingId, floorId, roomId, branchId]);

  // ============================================================
  // 5. دوال التحكم
  // ============================================================
  const handleBuildingChange = useCallback((val: string) => {
    setBuildingId(val);
    setFloorId("");
    setRoomId("");
    setSelectedAssetIds([]);
    setTempSelectedAssetIds([]);
    setAssets([]);
    setFloors([]);
    setRooms([]);
  }, []);

  const handleFloorChange = useCallback((val: string) => {
    setFloorId(val);
    setRoomId("");
    setSelectedAssetIds([]);
    setTempSelectedAssetIds([]);
    setAssets([]);
    setRooms([]);
  }, []);

  const handleRoomChange = useCallback((val: string) => {
    setRoomId(val);
    setSelectedAssetIds([]);
    setTempSelectedAssetIds([]);
    setAssets([]);
  }, []);

  const handleAssetTypeChange = useCallback((val: string | null) => {
    setFormData((prev) => ({
      ...prev,
      assetTypeId: val ?? "",
    }));
    setSelectedAssetIds([]);
    setTempSelectedAssetIds([]);
    setAssets([]);
  }, []);

  // ============================================================
  // 6. حوار الأصول
  // ============================================================
  const openAssetDialog = useCallback(() => {
    setTempSelectedAssetIds([...selectedAssetIds]);
    setAssetDialogOpen(true);
  }, [selectedAssetIds]);

  const closeAssetDialog = useCallback(() => {
    setAssetDialogOpen(false);
  }, []);

  const confirmAssetSelection = useCallback(() => {
    setSelectedAssetIds(tempSelectedAssetIds);
    setAssetDialogOpen(false);
  }, [tempSelectedAssetIds]);

  const removeAsset = useCallback((assetId: string) => {
    setSelectedAssetIds((prev) => prev.filter((id) => id !== assetId));
  }, []);

  // ============================================================
  // 7. دوال مساعدة (نفس useMaintenanceForm)
  // ============================================================
  const getSelectedLocationSummary = useCallback(() => {
    if (roomId) {
      const room = rooms.find((r) => r.id === roomId);
      return room ? `${room.name} (${room.fullCode || ""})` : t("room");
    }
    if (floorId) {
      const floor = floors.find((f) => f.id === floorId);
      return floor ? floor.name : t("floor");
    }
    if (buildingId) {
      const building = buildings.find((b) => b.id === buildingId);
      return building ? building.name : t("building");
    }
    return t("notSelected");
  }, [roomId, floorId, buildingId, rooms, floors, buildings, t]);

  const isLocationSelected = useCallback(() => {
    return !!branchId && !!(buildingId || floorId || roomId);
  }, [branchId, buildingId, floorId, roomId]);

  // ============================================================
  // 8. إرسال النموذج (PUT) - بدون locationLevel
  // ============================================================
  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    if (!isLocationSelected()) {
      toast.error(t("locationRequired"));
      return;
    }
    if (!branchId) {
      toast.error(t("branchRequired"));
      return;
    }

    let finalFrequencyDays = formData.frequencyDays;
    if (!finalFrequencyDays || finalFrequencyDays <= 0) {
      finalFrequencyDays = frequencyStringToDays(formData.frequency);
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        frequency: formData.frequency,
        frequencyDays: finalFrequencyDays,
        leadDays: formData.leadDays,
        startDate: formData.startDate || null,
        notes: formData.notes,
        isActive: formData.isActive,
        branchId: branchId || null,
        buildingId: buildingId || null,
        floorId: floorId || null,
        roomId: roomId || null,
        assetTypeId: formData.assetTypeId || null,
        assetIds: selectedAssetIds,
      };

      const res = await fetch(`/api/maintenance/schedules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(t("updateSuccess"));
        router.push(`/${locale}/maintenance`);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || t("updateError"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    branchId,
    buildingId,
    floorId,
    roomId,
    selectedAssetIds,
    id,
    t,
    locale,
    router,
    isLocationSelected,
  ]);

  // ============================================================
  // 9. الإرجاع (بدون locationLevel و setLocationLevel)
  // ============================================================
  return {
    formData,
    setFormData,

    branchId,
    buildingId,
    floorId,
    roomId,

    buildings,
    floors,
    rooms,
    assetTypes,
    assets,

    selectedAssetIds,
    tempSelectedAssetIds,

    loading,
    loadingFloors,
    loadingRooms,
    loadingAssets,
    loadingAssetTypes,

    isSubmitting,
    assetDialogOpen,

    setBranchId,
    setBuildingId: handleBuildingChange,
    setFloorId: handleFloorChange,
    setRoomId: handleRoomChange,

    // ✅ الأنواع الصحيحة للتحديث الوظيفي
    setSelectedAssetIds,
    setTempSelectedAssetIds,

    handleSubmit,
    getSelectedLocationSummary,
    isLocationSelected,

    openAssetDialog,
    closeAssetDialog,
    confirmAssetSelection,
    removeAsset,

    handleAssetTypeChange,

    // دوال التحديث المحددة
    handleNameChange,
    handleFrequencyChange,
    handleLeadDaysChange,
    handleFrequencyDaysChange,
    handleStartDateChange,
    handleNotesChange,
    handleIsActiveChange,
  };
}