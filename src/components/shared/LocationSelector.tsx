// src/components/shared/LocationSelector.tsx
"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Building, Layers, DoorOpen } from "lucide-react";
import { Label } from "@/components/ui/label";
import { BuildingSelector } from "./BuildingSelector";
import { FloorSelector } from "./FloorSelector";
import { RoomSelector } from "./RoomSelector";
import type { Building as BuildingType, Floor as FloorType, Room as RoomType } from "@/types/assets";

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
  building: f.building ? {
    id: f.building.id,
    name: f.building.name,
    nameEn: f.building.nameEn ?? undefined,
  } : undefined,
});

const normalizeRoom = (r: RoomType) => ({
  ...r,
  nameEn: r.nameEn ?? undefined,
});

export function LocationSelector({ value, onChange, disabled = false }: LocationSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [selectedBuildingId, setSelectedBuildingId] = useState(value.buildingId);
  const [selectedFloorId, setSelectedFloorId] = useState(value.floorId);
  const [selectedRoomId, setSelectedRoomId] = useState(value.roomId);

  useEffect(() => {
    setSelectedBuildingId(value.buildingId);
    setSelectedFloorId(value.floorId);
    setSelectedRoomId(value.roomId);
  }, [value.buildingId, value.floorId, value.roomId]);

  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [floors, setFloors] = useState<FloorType[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // ✅ جلب المباني - مع حماية البيانات
  useEffect(() => {
    fetch("/api/locations/buildings")
      .then(res => res.json())
      .then(data => {
        setBuildings(Array.isArray(data) ? data : []);
      })
      .catch(() => setBuildings([]))
      .finally(() => setLoadingBuildings(false));
  }, []);

  // ✅ جلب الأدوار - مع حماية البيانات
  useEffect(() => {
    if (!selectedBuildingId) {
      setFloors([]);
      return;
    }
    setLoadingFloors(true);
    fetch(`/api/locations/buildings/${selectedBuildingId}/floors`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const floorsData = Array.isArray(data) ? data : [];
        const floorsWithBuilding = floorsData.map((floor: any) => ({
          ...floor,
          building: floor.building || null,
        }));
        setFloors(floorsWithBuilding);
      })
      .catch(() => setFloors([]))
      .finally(() => setLoadingFloors(false));
  }, [selectedBuildingId]);

  // ✅ جلب الغرف - مع حماية البيانات
  useEffect(() => {
    if (!selectedFloorId) {
      setRooms([]);
      return;
    }
    setLoadingRooms(true);
    fetch(`/api/locations/floors/${selectedFloorId}/rooms`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setRooms(Array.isArray(data) ? data : []);
      })
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
  }, [selectedFloorId]);

  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedFloorId("");
    setSelectedRoomId("");
  };

  const handleFloorChange = (floorId: string) => {
    setSelectedFloorId(floorId);
    setSelectedRoomId("");
  };

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    onChange({ buildingId: selectedBuildingId, floorId: selectedFloorId, roomId });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground/70 flex items-center gap-1">
          <Building size={12} /> {isRtl ? "المبنى / الموقع" : "Building / Location"}
        </Label>
        <BuildingSelector
          value={selectedBuildingId}
          onValueChange={handleBuildingChange}
          buildings={buildings.map(normalizeBuilding)}
          loading={loadingBuildings}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground/70 flex items-center gap-1">
          <Layers size={12} /> {isRtl ? "الدور / المنطقة" : "Floor / Zone"}
        </Label>
        <FloorSelector
          value={selectedFloorId}
          onValueChange={handleFloorChange}
          floors={floors.map(normalizeFloor)}
          buildingId={selectedBuildingId}
          loading={loadingFloors}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground/70 flex items-center gap-1">
          <DoorOpen size={12} /> {isRtl ? "الوحدة" : "Unit"}
        </Label>
        <RoomSelector
          value={selectedRoomId}
          onValueChange={handleRoomChange}
          rooms={rooms.map(normalizeRoom)}
          floorId={selectedFloorId}
          loading={loadingRooms}
        />
      </div>
    </div>
  );
}

export default LocationSelector;