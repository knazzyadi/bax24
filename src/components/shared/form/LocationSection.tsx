"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationSectionProps {
  buildingId: string;
  floorId: string;
  roomId: string;
  buildings: { value: string; label: string }[];
  floors: { value: string; label: string }[];
  rooms: { value: string; label: string }[];
  loadingBuildings: boolean;
  loadingFloors: boolean;
  loadingRooms: boolean;
  onBuildingChange: (val: string) => void;
  onFloorChange: (val: string) => void;
  onRoomChange: (val: string) => void;
  isRtl: boolean;
  disabled: boolean;
}

export function LocationSection({
  buildingId,
  floorId,
  roomId,
  buildings,
  floors,
  rooms,
  loadingBuildings,
  loadingFloors,
  loadingRooms,
  onBuildingChange,
  onFloorChange,
  onRoomChange,
  isRtl,
  disabled,
}: LocationSectionProps) {
  return (
    <div className="space-y-4">
      {/* المبنى */}
      <div>
        <Label className="text-base font-semibold mb-2 block">
          {isRtl ? "المبنى *" : "Building *"}
        </Label>
        <Select
          value={buildingId}
          onValueChange={onBuildingChange}
          disabled={disabled || loadingBuildings || buildings.length === 0}
        >
          <SelectTrigger className="h-12 text-base rounded-xl">
            <SelectValue
              placeholder={
                loadingBuildings
                  ? isRtl
                    ? "جاري التحميل..."
                    : "Loading..."
                  : isRtl
                  ? "اختر المبنى"
                  : "Select Building"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {buildings.map((building) => (
              <SelectItem key={building.value} value={building.value}>
                {building.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* الدور */}
      <div>
        <Label className="text-base font-semibold mb-2 block">
          {isRtl ? "الدور *" : "Floor *"}
        </Label>
        <Select
          value={floorId}
          onValueChange={onFloorChange}
          disabled={disabled || loadingFloors || !buildingId || floors.length === 0}
        >
          <SelectTrigger className="h-12 text-base rounded-xl">
            <SelectValue
              placeholder={
                !buildingId
                  ? isRtl
                    ? "اختر المبنى أولاً"
                    : "Select building first"
                  : loadingFloors
                  ? isRtl
                    ? "جاري التحميل..."
                    : "Loading..."
                  : isRtl
                  ? "اختر الدور"
                  : "Select Floor"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {floors.map((floor) => (
              <SelectItem key={floor.value} value={floor.value}>
                {floor.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* الغرفة */}
      <div>
        <Label className="text-base font-semibold mb-2 block">
          {isRtl ? "الغرفة *" : "Room *"}
        </Label>
        <Select
          value={roomId}
          onValueChange={onRoomChange}
          disabled={disabled || loadingRooms || !floorId || rooms.length === 0}
        >
          <SelectTrigger className="h-12 text-base rounded-xl">
            <SelectValue
              placeholder={
                !floorId
                  ? isRtl
                    ? "اختر الدور أولاً"
                    : "Select floor first"
                  : loadingRooms
                  ? isRtl
                    ? "جاري التحميل..."
                    : "Loading..."
                  : isRtl
                  ? "اختر الغرفة"
                  : "Select Room"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((room) => (
              <SelectItem key={room.value} value={room.value}>
                {room.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}