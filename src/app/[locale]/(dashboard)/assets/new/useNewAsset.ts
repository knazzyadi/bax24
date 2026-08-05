// src/app/[locale]/(dashboard)/assets/new/useNewAsset.ts
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AssetStatus, AssetType, Building, Floor, Room, Branch } from "@/types/assets";
import type { NewAssetFormData } from "./types";
import { generateSequentialCode } from "@/services/api/assets";

// تعريف نوع الغرفة من API (مع حقل order اختياري)
interface ApiRoom {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  order?: number;
}

export function useNewAsset() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("AssetsForm");
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<AssetStatus[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string; nameEn?: string }[]>([]);

  // بيانات المواقع
  const [branches, setBranches] = useState<Branch[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // المعرفات المختارة
  const [branchId, setBranchId] = useState<string>("");
  const [buildingId, setBuildingId] = useState<string>("");
  const [floorId, setFloorId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoomFullCode, setSelectedRoomFullCode] = useState<string>("");

  const [formData, setFormData] = useState<NewAssetFormData>({
    name: "",
    nameEn: "",
    description: "",
    typeId: "",
    statusId: "",
    purchaseDate: "",
    operationDate: "",
    warrantyEnd: "",
    lastMaintenanceDate: "",
    roomId: "",
    notes: "",
    serialNumber: "",
    manufacturer: "",
    model: "",
    supplierId: "",
  });

  // =========================
  // جلب البيانات الأولية
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusesRes, typesRes, branchesRes, suppliersRes] = await Promise.all([
          fetch(`/api/asset-statuses?locale=${locale}`),
          fetch(`/api/asset-types?locale=${locale}`),
          fetch(`/api/locations/branches?locale=${locale}`),
          fetch(`/api/suppliers?locale=${locale}`),
        ]);
        if (statusesRes.ok) setStatuses(await statusesRes.json());
        if (typesRes.ok) setTypes(await typesRes.json());
        if (branchesRes.ok) setBranches(await branchesRes.json());
        if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
      } catch {
        toast.error(t("fetchError"));
      }
    };
    fetchData();
  }, [locale, t]);

  // جلب المباني
  useEffect(() => {
    if (!branchId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBuildings([]);
      return;
    }
    async function fetchBuildings() {
      try {
        const res = await fetch(`/api/locations/buildings?branchId=${branchId}`);
        if (res.ok) setBuildings(await res.json());
        else setBuildings([]);
      } catch {
        setBuildings([]);
      }
    }
    fetchBuildings();
  }, [branchId]);

  // جلب الأدوار
  useEffect(() => {
    if (!buildingId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFloors([]);

      setFloorId("");
      return;
    }
    async function fetchFloors() {
      setLoadingFloors(true);
      try {
        const res = await fetch(`/api/locations/buildings/${buildingId}/floors`);
        if (res.ok) setFloors(await res.json());
        else setFloors([]);
      } catch {
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    }
    fetchFloors();
  }, [buildingId]);

  // جلب الغرف
  useEffect(() => {
    if (!floorId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRooms([]);

      setSelectedRoomFullCode("");
      return;
    }
    async function fetchRooms() {
      setLoadingRooms(true);
      try {
        const res = await fetch(`/api/locations/floors/${floorId}/rooms`);
        if (res.ok) {
          const data = (await res.json()) as ApiRoom[];
          const currentBuilding = buildings.find((b) => b.id === buildingId);
          const currentFloor = floors.find((f) => f.id === floorId);
          const buildingCode = currentBuilding?.code || "";
          const floorCode = currentFloor?.code || "";

          const roomsWithCode: Room[] = data.map((room: ApiRoom) => ({
            id: room.id,
            name: room.name,
            nameEn: room.nameEn ?? undefined,
            floorId: floorId,
            buildingId: buildingId,
            code: room.code || "",
            fullCode: `${buildingCode}-${floorCode}-${room.code || ""}`,
            order: room.order ?? 0,
          }));
          setRooms(roomsWithCode);
        } else {
          setRooms([]);
        }
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    }
    fetchRooms();
  }, [floorId, buildingId, buildings, floors]);

  // =========================
  // دوال التحكم
  // =========================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: NewAssetFormData) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev: NewAssetFormData) => ({ ...prev, [field]: value }));
  };

  const handleBranchChange = (value: string) => {
    setBranchId(value);
    setBuildingId("");
    setFloorId("");
    setRoomId("");
    setFormData((prev: NewAssetFormData) => ({ ...prev, roomId: "" }));
    setSelectedRoomFullCode("");
  };

  const handleBuildingChange = (value: string) => {
    setBuildingId(value);
    setFloorId("");
    setRoomId("");
    setFormData((prev: NewAssetFormData) => ({ ...prev, roomId: "" }));
    setSelectedRoomFullCode("");
  };

  const handleFloorChange = (value: string) => {
    setFloorId(value);
    setRoomId("");
    setFormData((prev: NewAssetFormData) => ({ ...prev, roomId: "" }));
    setSelectedRoomFullCode("");
  };

  const handleRoomChange = (value: string) => {
    setRoomId(value);
    setFormData((prev: NewAssetFormData) => ({ ...prev, roomId: value }));
    const selectedRoom = rooms.find((r) => r.id === value);
    setSelectedRoomFullCode(selectedRoom?.fullCode || "");
  };

  // =========================
  // الإرسال
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    if (!formData.typeId || formData.typeId === "all") {
      toast.error(t("typeRequired"));
      return;
    }

    if (!roomId) {
      toast.error(t("locationRequired"));
      return;
    }

    setLoading(true);
    try {
      const sequentialCode = await generateSequentialCode(
        formData.typeId || null,
        roomId
      );
      const cleanTypeId =
        formData.typeId && formData.typeId !== "all" ? formData.typeId : null;
      const cleanStatusId =
        formData.statusId && formData.statusId !== "all"
          ? formData.statusId
          : null;

      const payload = {
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim() || null,
        description: formData.description.trim() || null,
        code: sequentialCode,
        typeId: cleanTypeId,
        statusId: cleanStatusId,
        purchaseDate: formData.purchaseDate || null,
        operationDate: formData.operationDate || null,
        warrantyEnd: formData.warrantyEnd || null,
        lastMaintenanceDate: formData.lastMaintenanceDate || null,
        roomId: roomId,
        notes: formData.notes || null,
        serialNumber: formData.serialNumber.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        model: formData.model.trim() || null,
        supplierId: formData.supplierId || null,
      };

      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { error: rawText };
      }

      if (res.ok) {
        toast.success(t("createSuccess"));
        router.push(`/${locale}/assets`);
        router.refresh();
      } else {
        toast.error(data.error || t("createError"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    statuses,
    types,
    suppliers,
    branches,
    buildings,
    floors,
    rooms,
    branchId,
    buildingId,
    floorId,
    roomId,
    selectedRoomFullCode,
    loadingFloors,
    loadingRooms,
    loading,
    isRtl,
    handleChange,
    handleSelectChange,
    handleBranchChange,
    handleBuildingChange,
    handleFloorChange,
    handleRoomChange,
    handleSubmit,
  };
}