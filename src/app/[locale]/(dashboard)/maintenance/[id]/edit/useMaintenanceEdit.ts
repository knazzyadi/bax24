// src/app/[locale]/(dashboard)/maintenance/[id]/edit/useMaintenanceEdit.ts

"use client";

import { useState, useEffect, useCallback } from "react";
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

interface ScheduleAsset {
  asset: {
    id: string;
  };
}

interface UseMaintenanceEditProps {
  id: string;
}

export function useMaintenanceEdit({
  id,
}: UseMaintenanceEditProps): UseMaintenanceEditReturn {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("MaintenanceForm");

  // ============================================================
  // State
  // ============================================================

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [tempSelectedAssetIds, setTempSelectedAssetIds] = useState<string[]>([]);

  const [branchId, setBranchId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomId, setRoomId] = useState("");

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [assetDialogOpen, setAssetDialogOpen] = useState(false);

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
  // تحميل بيانات الجدول
  // ============================================================

  useEffect(() => {
    async function fetchEditData() {
      try {
        const [scheduleRes, assetTypesRes] = await Promise.all([
          fetch(`/api/maintenance/schedules/${id}`),
          fetch("/api/asset-types", {
            cache: "no-store",
          }),
        ]);

        if (!scheduleRes.ok) {
          throw new Error("Failed to load schedule");
        }

        if (assetTypesRes.ok) {
          const types: AssetType[] = await assetTypesRes.json();
          setAssetTypes(types);
        }

        const data = await scheduleRes.json();

        setFormData({
          name: data.name || "",
          frequency: data.frequency || "MONTHLY",
          frequencyDays:
            data.frequencyDays ||
            frequencyStringToDays(data.frequency),
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

        const assetIds =
          (data.scheduleAssets as ScheduleAsset[] | undefined)?.map(
            ({ asset }) => asset.id
          ) || [];

        setSelectedAssetIds(assetIds);
        setTempSelectedAssetIds(assetIds);
      } catch (error) {
        console.error(error);

        toast.error(
          t("fetchError") || "فشل تحميل بيانات الجدول"
        );

        router.push(`/${locale}/maintenance`);
      } finally {
        setLoading(false);
      }
    }

    fetchEditData();
  }, [id, locale, router, t]);

  // ============================================================
  // تحميل المباني
  // ============================================================

  useEffect(() => {
    const controller = new AbortController();

    async function fetchBuildings() {
      if (!branchId) {
        return;
      }

      try {
        const res = await fetch(
          `/api/locations/buildings?branchId=${branchId}`,
          {
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          setBuildings([]);
          return;
        }

        const data: Building[] = await res.json();
        setBuildings(data);
      } catch {
        setBuildings([]);
      }
    }

    fetchBuildings();

    return () => controller.abort();
  }, [branchId]);

  // ============================================================
  // تحميل الطوابق
  // ============================================================

  useEffect(() => {
    const controller = new AbortController();

    async function fetchFloors() {
      if (!buildingId) {
        return;
      }

      setLoadingFloors(true);

      try {
        const res = await fetch(
          `/api/locations/buildings/${buildingId}/floors`,
          {
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          setFloors([]);
          return;
        }

        const data = await res.json();
        setFloors(Array.isArray(data) ? data : []);
      } catch {
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    }

    fetchFloors();

    return () => controller.abort();
  }, [buildingId]);

  // ============================================================
  // تحميل الغرف
  // ============================================================

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRooms() {
      if (!floorId) {
        return;
      }

      setLoadingRooms(true);

      try {
        const res = await fetch(
          `/api/locations/floors/${floorId}/rooms`,
          {
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          setRooms([]);
          return;
        }

        const data = await res.json();
        setRooms(Array.isArray(data) ? data : []);
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    }

    fetchRooms();

    return () => controller.abort();
  }, [floorId]);

  // ============================================================
  // تحميل الأصول حسب الموقع ونوع الأصل
  // ============================================================

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAssets() {
      if (!formData.assetTypeId || !buildingId) {
        return;
      }

      const params = new URLSearchParams({
        typeId: formData.assetTypeId,
      });

      if (branchId) {
        params.append("branchId", branchId);
      }

      if (buildingId) {
        params.append("buildingId", buildingId);
      }

      if (floorId) {
        params.append("floorId", floorId);
      }

      if (roomId) {
        params.append("roomId", roomId);
      }

      setLoadingAssets(true);

      try {
        const res = await fetch(
          `/api/assets?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          setAssets([]);
          return;
        }

        const data = await res.json();
        setAssets(data.assets || []);
      } catch {
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    }

    fetchAssets();

    return () => controller.abort();
  }, [
    formData.assetTypeId,
    branchId,
    buildingId,
    floorId,
    roomId,
  ]);

  // ============================================================
  // تغيير الموقع
  // ============================================================

  const resetAssetSelection = useCallback(() => {
    setSelectedAssetIds([]);
    setTempSelectedAssetIds([]);
    setAssets([]);
  }, []);

  const handleBuildingChange = useCallback(
    (value: string) => {
      setBuildingId(value);
      setFloorId("");
      setRoomId("");

      setFloors([]);
      setRooms([]);

      resetAssetSelection();
    },
    [resetAssetSelection]
  );

  const handleFloorChange = useCallback(
    (value: string) => {
      setFloorId(value);
      setRoomId("");

      setRooms([]);

      resetAssetSelection();
    },
    [resetAssetSelection]
  );

  const handleRoomChange = useCallback(
    (value: string) => {
      setRoomId(value);

      resetAssetSelection();
    },
    [resetAssetSelection]
  );

  const handleAssetTypeChange = useCallback(
    (value: string | null) => {
      setFormData((prev) => ({
        ...prev,
        assetTypeId: value ?? "",
      }));

      resetAssetSelection();
    },
    [resetAssetSelection]
  );

  // ============================================================
  // نافذة اختيار الأصول
  // ============================================================

  const openAssetDialog = useCallback(() => {
    setTempSelectedAssetIds(selectedAssetIds);
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
    setSelectedAssetIds((prev) =>
      prev.filter((id) => id !== assetId)
    );
  }, []);

  // ============================================================
  // دوال مساعدة
  // ============================================================

  const getSelectedLocationSummary = useCallback(() => {
    if (roomId) {
      const room = rooms.find(({ id }) => id === roomId);

      return room
        ? `${room.name} (${room.fullCode ?? ""})`
        : t("room");
    }

    if (floorId) {
      const floor = floors.find(({ id }) => id === floorId);

      return floor?.name ?? t("floor");
    }

    if (buildingId) {
      const building = buildings.find(
        ({ id }) => id === buildingId
      );

      return building?.name ?? t("building");
    }

    return t("notSelected");
  }, [
    roomId,
    floorId,
    buildingId,
    rooms,
    floors,
    buildings,
    t,
  ]);

  const isLocationSelected = useCallback(() => {
    return Boolean(branchId && buildingId);
  }, [branchId, buildingId]);

  // ============================================================
  // إرسال النموذج
  // ============================================================

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    if (!branchId) {
      toast.error(t("branchRequired"));
      return;
    }

    if (!isLocationSelected()) {
      toast.error(t("locationRequired"));
      return;
    }

    const frequencyDays =
      formData.frequencyDays > 0
        ? formData.frequencyDays
        : frequencyStringToDays(formData.frequency);

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        frequency: formData.frequency,
        frequencyDays,
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

      const res = await fetch(
        `/api/maintenance/schedules/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const error = await res.json();

        toast.error(error.error || t("updateError"));
        return;
      }

      toast.success(t("updateSuccess"));

      router.push(`/${locale}/maintenance`);
      router.refresh();
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
    locale,
    router,
    t,
    isLocationSelected,
  ]);

  // ============================================================
  // تحديث formData
  // ============================================================

  const handleNameChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
    }));
  }, []);

  const handleFrequencyChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      frequency: value,
    }));
  }, []);

  const handleLeadDaysChange = useCallback((value: number) => {
    setFormData((prev) => ({
      ...prev,
      leadDays: value,
    }));
  }, []);

  const handleFrequencyDaysChange = useCallback((value: number) => {
    setFormData((prev) => ({
      ...prev,
      frequencyDays: value,
    }));
  }, []);

  const handleStartDateChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      startDate: value,
    }));
  }, []);

  const handleNotesChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      notes: value,
    }));
  }, []);

  const handleIsActiveChange = useCallback((value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isActive: value,
    }));
  }, []);

  // ============================================================
  // Return مع قيم مشتقة (visible) بدلاً من تعديل state مباشرة
  // ============================================================

  const visibleBuildings = branchId ? buildings : [];
  const visibleFloors = buildingId ? floors : [];
  const visibleRooms = floorId ? rooms : [];
  const visibleAssets =
    formData.assetTypeId && buildingId ? assets : [];

  return {
    formData,
    setFormData,

    branchId,
    buildingId,
    floorId,
    roomId,

    buildings: visibleBuildings,
    floors: visibleFloors,
    rooms: visibleRooms,

    assetTypes,
    assets: visibleAssets,

    selectedAssetIds,
    tempSelectedAssetIds,

    loading,
    loadingFloors,
    loadingRooms,
    loadingAssets,
    loadingAssetTypes: false,

    isSubmitting,
    assetDialogOpen,

    setBranchId,
    setBuildingId: handleBuildingChange,
    setFloorId: handleFloorChange,
    setRoomId: handleRoomChange,

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

    handleNameChange,
    handleFrequencyChange,
    handleLeadDaysChange,
    handleFrequencyDaysChange,
    handleStartDateChange,
    handleNotesChange,
    handleIsActiveChange,
  };
}