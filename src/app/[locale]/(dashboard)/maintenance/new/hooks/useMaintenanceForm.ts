// src/app/[locale]/(dashboard)/maintenance/new/hooks/useMaintenanceForm.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";


interface Building {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

interface Floor {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  buildingId: string;
}

interface Room {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  floorId: string;
  buildingId?: string;
  fullCode?: string;
}

interface AssetType {
  id: string;
  name: string;
  nameEn?: string;
}

interface Asset {
  id: string;
  name: string;
  code: string;
  nameEn?: string;
}

type LocationLevel = "building" | "floor" | "room";

// دالة تحويل التردد إلى أيام
function frequencyStringToDays(freq: string): number {
  switch (freq) {
    case "MONTHLY": return 30;
    case "QUARTERLY": return 90;
    case "SEMI_ANNUAL": return 180;
    case "YEARLY": return 365;
    default: return 30;
  }
}

export function useMaintenanceForm() {
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
  const [locationLevel, setLocationLevel] = useState<LocationLevel>("building");

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
  const [formData, setFormData] = useState({
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
          fetch("/api/buildings", { cache: "no-store" }),
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

  // ===== جلب أنواع الأصول حسب الدور =====
  useEffect(() => {
    if (!floorId) return;

    const controller = new AbortController();
    setLoadingAssetTypes(true);

    async function fetchFilteredTypes() {
      try {
        const res = await fetch(`/api/asset-types?floorId=${floorId}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setAssetTypes(data);
        } else {
          console.error("فشل جلب الأنواع حسب الدور");
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
  }, [floorId]);

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
        const res = await fetch(`/api/buildings/${buildingId}/floors`, {
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
        const res = await fetch(`/api/floors/${floorId}/rooms`, {
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

    // ✅ منع جلب جميع أصول الفرع (يتطلب وجود مبنى أو دور أو غرفة)
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

  // ===== دوال التحكم =====
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
    // ✅ إعادة تعيين الأصول عند تغيير النوع
    setSelectedAssetIds([]);
    setTempSelectedAssetIds([]);
    setAssets([]);
  }, []);

  // ===== حوار الأصول =====
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

  // ===== إرسال النموذج =====
  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    let locationValid = false;
    if (locationLevel === "room" && roomId) locationValid = true;
    else if (locationLevel === "floor" && floorId) locationValid = true;
    else if (locationLevel === "building" && buildingId) locationValid = true;

    if (!locationValid) {
      toast.error(t("locationRequired"));
      return;
    }
    if (!branchId) {
      toast.error(t("branchRequired"));
      return;
    }
    if (!formData.assetTypeId && selectedAssetIds.length === 0) {
      toast.error(t("assetTypeOrAssetsRequired"));
      return;
    }

    let finalFrequencyDays = formData.frequencyDays;
    if (!finalFrequencyDays || finalFrequencyDays <= 0) {
      finalFrequencyDays = frequencyStringToDays(formData.frequency);
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        frequency: formData.frequency,
        frequencyDays: finalFrequencyDays,
        leadDays: formData.leadDays,
        startDate: formData.startDate || null,
        branchId,
        assetTypeId: formData.assetTypeId || null,
        assetIds: selectedAssetIds,
        notes: formData.notes,
        isActive: formData.isActive,
      };

      if (locationLevel === "room" && roomId) payload.roomId = roomId;
      else if (locationLevel === "floor" && floorId) payload.floorId = floorId;
      else if (locationLevel === "building" && buildingId)
        payload.buildingId = buildingId;

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
  }, [formData, branchId, buildingId, floorId, roomId, locationLevel, selectedAssetIds, t, locale, router]);

  // ===== دوال مساعدة =====
  const getSelectedLocationSummary = useCallback(() => {
    if (locationLevel === "room" && roomId) {
      const room = rooms.find((r) => r.id === roomId);
      return room ? `${room.name} (${room.fullCode})` : t("room");
    }
    if (locationLevel === "floor" && floorId) {
      const floor = floors.find((f) => f.id === floorId);
      return floor ? floor.name : t("floor");
    }
    if (locationLevel === "building" && buildingId) {
      const building = buildings.find((b) => b.id === buildingId);
      return building ? building.name : t("building");
    }
    return t("notSelected");
  }, [locationLevel, roomId, floorId, buildingId, rooms, floors, buildings, t]);

  const isLocationSelected = useCallback(() => {
    if (locationLevel === "room") return !!roomId;
    if (locationLevel === "floor") return !!floorId;
    if (locationLevel === "building") return !!buildingId;
    return false;
  }, [locationLevel, roomId, floorId, buildingId]);

  // ===== الإرجاع =====
  return {
    // البيانات
    formData,
    setFormData,
    branchId,
    buildingId,
    floorId,
    roomId,
    locationLevel,
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

    // الدوال
    setBranchId,
    setBuildingId: handleBuildingChange,
    setFloorId: handleFloorChange,
    setRoomId: handleRoomChange,
    setLocationLevel,
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
  };
}