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

// ============================================================
// نوع مؤقت لبيانات الغرفة من الـ API (قد تختلف عن Room الكامل)
// ============================================================
type RoomResponse = {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
};

export function useMaintenanceForm(): UseMaintenanceFormReturn {
  const router = useRouter();
  const locale = useLocale();
  // ✅ isRtl غير مستخدم – تم حذفه
  const t = useTranslations("MaintenanceForm");

  // ===== State =====
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(false);
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
  const [loadingBuildings, setLoadingBuildings] = useState(true);
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

  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================================
  // دوال التحميل (تقبل AbortSignal اختياري)
  // ============================================================

  const loadInitialData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [assetTypesRes, buildingsRes] = await Promise.all([
        fetch("/api/asset-types", { cache: "no-store", signal }),
        fetch("/api/locations/buildings", { cache: "no-store", signal }),
      ]);
      if (assetTypesRes.ok) setAssetTypes(await assetTypesRes.json());
      if (buildingsRes.ok) setBuildings(await buildingsRes.json());
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error(error);
        toast.error(t("fetchError"));
      }
    } finally {
      setLoadingBuildings(false);
      setDataLoaded(true);
    }
  }, [t]);

  const loadFilteredAssetTypes = useCallback(async (signal?: AbortSignal) => {
    if (!buildingId && !floorId && !roomId) return;

    setLoadingAssetTypes(true);
    try {
      const params = new URLSearchParams();
      if (buildingId) params.append("buildingId", buildingId);
      if (floorId) params.append("floorId", floorId);
      if (roomId) params.append("roomId", roomId);

      const res = await fetch(`/api/asset-types?${params.toString()}`, {
        signal,
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
  }, [buildingId, floorId, roomId]);

  const loadFloors = useCallback(async (signal?: AbortSignal) => {
    if (!buildingId) {
      setFloors([]);
      return;
    }

    setLoadingFloors(true);
    try {
      const res = await fetch(`/api/locations/buildings/${buildingId}/floors`, {
        signal,
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
  }, [buildingId]);

  const loadRooms = useCallback(async (signal?: AbortSignal) => {
    if (!floorId) {
      setRooms([]);
      return;
    }

    setLoadingRooms(true);
    try {
      const res = await fetch(`/api/locations/floors/${floorId}/rooms`, {
        signal,
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const currentBuilding = buildings.find((b) => b.id === buildingId);
        const currentFloor = floors.find((f) => f.id === floorId);
        const buildingCode = currentBuilding?.code || "";
        const floorCode = currentFloor?.code || "";
        // ✅ استخدام النوع المخصص بدلاً من any
        const roomsWithCode = (Array.isArray(data) ? data : []).map(
          (room: RoomResponse) => ({
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
  }, [floorId, buildingId, buildings, floors]);

  const loadAssets = useCallback(async (signal?: AbortSignal) => {
    const hasAssetType = formData.assetTypeId && formData.assetTypeId !== "";
    if (!hasAssetType || (!buildingId && !floorId && !roomId)) {
      setAssets([]);
      return;
    }

    const params = new URLSearchParams();
    params.append("typeId", formData.assetTypeId);
    if (branchId) params.append("branchId", branchId);
    if (buildingId) params.append("buildingId", buildingId);
    if (floorId) params.append("floorId", floorId);
    if (roomId) params.append("roomId", roomId);

    setLoadingAssets(true);
    try {
      const res = await fetch(`/api/assets?${params.toString()}`, {
        signal,
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
  }, [buildingId, floorId, roomId, formData.assetTypeId, branchId]);

  // ============================================================
  // useEffect مع AbortController ودالة async داخلية
  // ============================================================

  // الأول: تحميل البيانات الأولية
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
    void loadInitialData(controller.signal);
    }

    fetchData();

    return () => controller.abort();
  }, [loadInitialData]);

  // الثاني: تحميل أنواع الأصول حسب الموقع
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      await loadFilteredAssetTypes(controller.signal);
    }

    fetchData();

    return () => controller.abort();
  }, [loadFilteredAssetTypes]);

  // الثالث: تحميل الأدوار
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      await loadFloors(controller.signal);
    }

    fetchData();

    return () => controller.abort();
  }, [loadFloors]);

  // الرابع: تحميل الغرف
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      await loadRooms(controller.signal);
    }

    fetchData();

    return () => controller.abort();
  }, [loadRooms]);

  // الخامس: تحميل الأصول (مع إلغاء الطلب السابق)
  useEffect(() => {
    // إلغاء الطلب السابق إذا كان موجوداً
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function fetchData() {
      await loadAssets(controller.signal);
    }

    fetchData();

    return () => {
      controller.abort();
      abortControllerRef.current = null;
    };
  }, [loadAssets]);

  // ============================================================
  // باقي الدوال (بدون تغيير)
  // ============================================================
  const handleNameChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, name: value }));
  }, []);

  const handleFrequencyChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      frequency: value,
      frequencyDays: frequencyStringToDays(value),
    }));
  }, []);

  const handleFrequencyDaysChange = useCallback((value: number) => {
    setFormData((prev) => ({ ...prev, frequencyDays: value }));
  }, []);

  const handleLeadDaysChange = useCallback((value: number) => {
    setFormData((prev) => ({ ...prev, leadDays: value }));
  }, []);

  const handleStartDateChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, startDate: value }));
  }, []);

  const handleIsActiveChange = useCallback((value: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: value }));
  }, []);

  const handleNotesChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, notes: value }));
  }, []);

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
    setFormData((prev) => ({ ...prev, assetTypeId: val ?? "" }));
    setSelectedAssetIds([]);
    setTempSelectedAssetIds([]);
    setAssets([]);
  }, []);

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

    handleNameChange,
    handleFrequencyChange,
    handleLeadDaysChange,
    handleFrequencyDaysChange,
    handleStartDateChange,
    handleIsActiveChange,
    handleNotesChange,
    handleAssetTypeChange,

    setBranchId,
    setBuildingId: handleBuildingChange,
    setFloorId: handleFloorChange,
    setRoomId: handleRoomChange,

    setSelectedAssetIds,
    setTempSelectedAssetIds,
    openAssetDialog,
    closeAssetDialog,
    confirmAssetSelection,
    removeAsset,

    handleSubmit,
    getSelectedLocationSummary,
    isLocationSelected,
  };
}