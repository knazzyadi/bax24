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

// دوال تطبيع لتحويل null إلى undefined
const normalizeBuilding = (b: BuildingType) => ({
  ...b,
  nameEn: b.nameEn ?? undefined,
});
const normalizeFloor = (f: FloorType) => ({
  ...f,
  nameEn: f.nameEn ?? undefined,
});
const normalizeRoom = (r: RoomType) => ({
  ...r,
  nameEn: r.nameEn ?? undefined,
});

export function LocationSelector({ value, onChange, disabled = false }: LocationSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // الحالة الداخلية للهرمية
  const [selectedBuildingId, setSelectedBuildingId] = useState(value.buildingId);
  const [selectedFloorId, setSelectedFloorId] = useState(value.floorId);
  const [selectedRoomId, setSelectedRoomId] = useState(value.roomId);

  // مزامنة الحالة الداخلية مع props (مهم في صفحة التعديل)
  useEffect(() => {
    setSelectedBuildingId(value.buildingId);
    setSelectedFloorId(value.floorId);
    setSelectedRoomId(value.roomId);
  }, [value.buildingId, value.floorId, value.roomId]);

  // بيانات المباني والأدوار والغرف
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [floors, setFloors] = useState<FloorType[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // جلب المباني
  useEffect(() => {
    fetch("/api/buildings")
      .then(res => res.json())
      .then(setBuildings)
      .catch(console.error)
      .finally(() => setLoadingBuildings(false));
  }, []);

  // جلب الأدوار عند تغيير المبنى المختار داخلياً
  useEffect(() => {
    if (!selectedBuildingId) {
      setFloors([]);
      return;
    }
    setLoadingFloors(true);
    fetch(`/api/buildings/${selectedBuildingId}/floors`)
      .then(res => res.ok ? res.json() : [])
      .then(setFloors)
      .catch(() => setFloors([]))
      .finally(() => setLoadingFloors(false));
  }, [selectedBuildingId]);

  // جلب الغرف عند تغيير الدور المختار داخلياً
  useEffect(() => {
    if (!selectedFloorId) {
      setRooms([]);
      return;
    }
    setLoadingRooms(true);
    fetch(`/api/floors/${selectedFloorId}/rooms`)
      .then(res => res.ok ? res.json() : [])
      .then(setRooms)
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
  }, [selectedFloorId]);

  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedFloorId("");
    setSelectedRoomId("");
    // لا نبلغ الأب حتى يتم اختيار الغرفة
  };

  const handleFloorChange = (floorId: string) => {
    setSelectedFloorId(floorId);
    setSelectedRoomId("");
  };

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    // الآن فقط نبلغ الأب بالغرفة المختارة (مع الاحتفاظ بالمبنى والدور للمزامنة المستقبلية)
    onChange({ buildingId: selectedBuildingId, floorId: selectedFloorId, roomId });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label className="text-xs font-bold text-muted-foreground/70 flex items-center gap-1">
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
        <Label className="text-xs font-bold text-muted-foreground/70 flex items-center gap-1">
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
        <Label className="text-xs font-bold text-muted-foreground/70 flex items-center gap-1">
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