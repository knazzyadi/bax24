// src/components/shared/LocationSelector.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import { Building, Layers, DoorOpen } from "lucide-react";
import { Label } from "@/components/ui/label";
import { BuildingSelector } from "./BuildingSelector";
import { FloorSelector } from "./FloorSelector";
import { RoomSelector } from "./RoomSelector";
import type {
  Building as BuildingType,
  Floor as FloorType,
  Room as RoomType,
} from "@/types/assets";

export interface LocationValue {
  buildingId: string;
  floorId: string;
  roomId: string;
}

interface LocationSelectorProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  disabled?: boolean;
}

const normalizeBuilding = (b: BuildingType) => ({
  ...b,
  nameEn: b.nameEn ?? undefined,
});

const normalizeFloor = (f: FloorType) => ({
  ...f,
  nameEn: f.nameEn ?? undefined,
  building: f.building
    ? {
        id: f.building.id,
        name: f.building.name,
        nameEn: f.building.nameEn ?? undefined,
      }
    : undefined,
});

const normalizeRoom = (r: RoomType) => ({
  ...r,
  nameEn: r.nameEn ?? undefined,
});

export function LocationSelector({
  value,
  onChange,
  disabled = false,
}: LocationSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [selectedBuildingId, setSelectedBuildingId] = useState(value.buildingId);
  const [selectedFloorId, setSelectedFloorId] = useState(value.floorId);
  const [selectedRoomId, setSelectedRoomId] = useState(value.roomId);

  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [floors, setFloors] = useState<FloorType[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);

  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // ============================================================
  // تحميل المباني (مرة واحدة عند التحميل)
  // ============================================================
  useEffect(() => {
    const controller = new AbortController();

    const loadBuildings = async () => {
      setLoadingBuildings(true);

      try {
        const res = await fetch("/api/locations/buildings", {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("Failed to fetch buildings");
        }

        const data = await res.json();
        setBuildings(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching buildings:", error);
          setBuildings([]);
        }
      } finally {
        setLoadingBuildings(false);
      }
    };

    loadBuildings();

    return () => controller.abort();
  }, []);

  // ============================================================
  // تحميل الطوابق عند تغيير المبنى
  // ============================================================
  useEffect(() => {
    const controller = new AbortController();

    const loadFloors = async () => {
      if (!selectedBuildingId) {
        setFloors([]);
        return;
      }

      setLoadingFloors(true);

      try {
        const res = await fetch(
          `/api/locations/buildings/${selectedBuildingId}/floors`,
          {
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch floors");
        }

        const data = await res.json();
        setFloors(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching floors:", error);
          setFloors([]);
        }
      } finally {
        setLoadingFloors(false);
      }
    };

    loadFloors();

    return () => controller.abort();
  }, [selectedBuildingId]);

  // ============================================================
  // تحميل الغرف عند تغيير الدور
  // ============================================================
  useEffect(() => {
    const controller = new AbortController();

    const loadRooms = async () => {
      if (!selectedFloorId) {
        setRooms([]);
        return;
      }

      setLoadingRooms(true);

      try {
        const res = await fetch(
          `/api/locations/floors/${selectedFloorId}/rooms`,
          {
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch rooms");
        }

        const data = await res.json();
        setRooms(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching rooms:", error);
          setRooms([]);
        }
      } finally {
        setLoadingRooms(false);
      }
    };

    loadRooms();

    return () => controller.abort();
  }, [selectedFloorId]);

  // ============================================================
  // دوال التطبيع
  // ============================================================
  const normalizedBuildings = useMemo(
    () => buildings.map(normalizeBuilding),
    [buildings]
  );

  const normalizedFloors = useMemo(
    () => floors.map(normalizeFloor),
    [floors]
  );

  const normalizedRooms = useMemo(
    () => rooms.map(normalizeRoom),
    [rooms]
  );

  // ============================================================
  // دوال التغيير
  // ============================================================
  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedFloorId("");
    setSelectedRoomId("");

    onChange({
      buildingId,
      floorId: "",
      roomId: "",
    });
  };

  const handleFloorChange = (floorId: string) => {
    setSelectedFloorId(floorId);
    setSelectedRoomId("");

    onChange({
      buildingId: selectedBuildingId,
      floorId,
      roomId: "",
    });
  };

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);

    onChange({
      buildingId: selectedBuildingId,
      floorId: selectedFloorId,
      roomId,
    });
  };

  // ============================================================
  // العرض
  // ============================================================
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground/70 flex items-center gap-1">
          <Building size={12} />
          {isRtl ? "المبنى / الموقع" : "Building / Location"}
        </Label>
        <BuildingSelector
          value={selectedBuildingId}
          onValueChange={handleBuildingChange}
          buildings={normalizedBuildings}
          loading={loadingBuildings}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground/70 flex items-center gap-1">
          <Layers size={12} />
          {isRtl ? "الدور / المنطقة" : "Floor / Zone"}
        </Label>
        <FloorSelector
          value={selectedFloorId}
          onValueChange={handleFloorChange}
          floors={normalizedFloors}
          buildingId={selectedBuildingId}
          loading={loadingFloors}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground/70 flex items-center gap-1">
          <DoorOpen size={12} />
          {isRtl ? "الوحدة" : "Unit"}
        </Label>
        <RoomSelector
          value={selectedRoomId}
          onValueChange={handleRoomChange}
          rooms={normalizedRooms}
          floorId={selectedFloorId}
          loading={loadingRooms}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export default LocationSelector;