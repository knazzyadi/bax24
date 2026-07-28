// src/app/[locale]/(dashboard)/maintenance/useMaintenanceForm.ts
import { useState, useEffect, useCallback, useRef } from "react";
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
  UseMaintenanceFormReturn,
} from "./types";
import { frequencyStringToDays } from "./utils";

export function useMaintenanceForm(): UseMaintenanceFormReturn {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("MaintenanceForm");

  // ===== State =====
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // بيانات أنواع الأصول والأصول
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // حالة الموقع الهرمي
  const [branchId, setBranchId] = useState<string>("");
  const [buildingId, setBuildingId] = useState<string>("");
  const [floorId, setFloorId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  // بيانات المباني والأدوار والغرف
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // حوار الأصول
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [tempSelectedAssetIds, setTempSelectedAssetIds] = useState<string[]>([]);

  // بيانات النموذج
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

  // ===== AbortController =====
  const abortControllerRef = useRef<AbortController | null>(null);

  // ===== جلب البيانات الأولية =====
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [assetTypesRes, buildingsRes] = await Promise.all([
          fetch("/api/asset-types", { cache: "no-store" }),
          fetch("/api/locations/buildings", { cache: "no-store" }),
        ]);
        if (assetTypesRes.ok) setAssetTypes(await assetTypesRes.json());
        if (buildingsRes.ok) setBuildings(await buildingsRes.json());
      } catch (error) {
        console.error(error);
        toast.error(t("fetchError"));
      } finally {
        setLoadingBuildings(false);
        setDataLoaded(true);
      }
    }
    fetchInitialData();
  }, [t]);

  // ===== جلب أنواع الأصول حسب الموقع (مبنى/دور/غرفة) =====
  useEffect(() => {
    if (!buildingId && !floorId && !roomId) return;

    const controller = new AbortController();
    setLoadingAssetTypes(true);

    async function fetchFilteredTypes() {
      try {
        const params = new URLSearchParams();
        if (buildingId) params.append("buildingId", buildingId);
        if (floorId) params.append("floorId", floorId);
        if (roomId) params.append("roomId", roomId);

        const res = await fetch(`/api/asset-types?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setAssetTypes(data);
        } else {
          console.error("فشل جلب الأنواع حسب الموقع");
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error(err);
        }
      } finally {
        setLoadingAssetTypes(false);
      }
    }

    fetchFilteredTypes();
    return () => controller.abort();
  }, [buildingId, floorId, roomId]);

  // ===== جلب الأدوار =====
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
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setFloors(Array.isArray(data) ? data : []);
        } else setFloors([]);
      } catch {
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    }

    fetchFloorsData();
    return () => controller.abort();
  }, [buildingId]);

  // ===== جلب الغرف =====
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
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const currentBuilding = buildings.find((b) => b.id === buildingId);
          const currentFloor = floors.find((f) => f.id === floorId);
          const buildingCode = currentBuilding?.code || "";
          const floorCode = currentFloor?.code || "";
          const roomsWithCode = (Array.isArray(data) ? data : []).map(
            (room: any) => ({
              id: room.id,
              name: room.name,
              nameEn: room.nameEn,
              code: room.code,
              floorId,
              buildingId,
              fullCode: `${buildingCode}-${floorCode}-${room.code || ""}`,
            })
          );
          setRooms(roomsWithCode);
        } else setRooms([]);
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    }

    fetchRoomsData();
    return () => controller.abort();
  }, [floorId, buildingId, buildings, floors]);

  // ===== جلب الأصول =====
  useEffect(() => {
    const hasAssetType = formData.assetTypeId && formData.assetTypeId !== "";
    if (!hasAssetType) {
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
    abortControllerRef.current = controller;
    setLoadingAssets(true);

    async function fetchAssetsData() {
      try {
        const res = await fetch(`/api/assets?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          setAssets(data.assets || []);
        } else {
          setAssets([]);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error(err);
        }
      } finally {
        setLoadingAssets(false);
      }
    }

    fetchAssetsData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [buildingId, floorId, roomId, formData.assetTypeId, branchId]);

  // ============================================================
  // ✅ دوال تعديل النموذج (المضافة حديثاً)
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
      frequencyDays: frequencyStringToDays(value),
    }));
  }, []);

  const handleFrequencyDaysChange = useCallback((value: number) => {
    setFormData((prev) => ({
      ...prev,
      frequencyDays: value,
    }));
  }, []);

  const handleLeadDaysChange = useCallback((value: number) => {
    setFormData((prev) => ({
      ...prev,
      leadDays: value,
    }));
  }, []);

  const handleStartDateChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      startDate: value,
    }));
  }, []);

  const handleIsActiveChange = useCallback((value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isActive: value,
    }));
  }, []);

  const handleNotesChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      notes: value,
    }));
  }, []);

  // ============================================================
  // دوال التحكم (الموجودة سابقاً)
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
  // حوار الأصول
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
  // handleSubmit (بدون إجبارية نوع الأصل أو الأصل)
  // ============================================================
  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    const hasLocation = !!buildingId || !!floorId || !!roomId;
    if (!hasLocation) {
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

      const res = await fetch("/api/maintenance/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(t("createSuccess"));
        router.push(`/${locale}/maintenance`);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || t("createError"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, branchId, buildingId, floorId, roomId, selectedAssetIds, t, locale, router]);

  // ============================================================
  // دوال مساعدة
  // ============================================================
  const getSelectedLocationSummary = useCallback(() => {
    if (roomId) {
      const room = rooms.find((r) => r.id === roomId);
      return room ? `${room.name} (${room.fullCode})` : t("room");
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
  // الإرجاع (مع جميع الدوال المطلوبة)
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
    loadingBuildings,
    loadingFloors,
    loadingRooms,
    loadingAssetTypes,
    loadingAssets,
    dataLoaded,
    isSubmitting,
    assetDialogOpen,

    // ✅ دوال تعديل النموذج (المضافة)
    handleNameChange,
    handleFrequencyChange,
    handleLeadDaysChange,
    handleFrequencyDaysChange,
    handleStartDateChange,
    handleIsActiveChange,
    handleNotesChange,
    handleAssetTypeChange,

    // دوال تحديث المعرفات
    setBranchId,
    setBuildingId: handleBuildingChange,
    setFloorId: handleFloorChange,
    setRoomId: handleRoomChange,

    // دوال الأصول
    setSelectedAssetIds,
    setTempSelectedAssetIds,
    openAssetDialog,
    closeAssetDialog,
    confirmAssetSelection,
    removeAsset,

    // دوال مساعدة
    handleSubmit,
    getSelectedLocationSummary,
    isLocationSelected,
  };
}