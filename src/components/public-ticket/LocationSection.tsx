"use client";

import { Label } from "@/components/ui/label";
import { AdaptiveSelect } from "@/components/shared/AdaptiveSelect";

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
      <div>
        <Label className="text-base font-semibold mb-2 block">
          {isRtl ? "المبنى *" : "Building *"}
        </Label>
        <AdaptiveSelect
          value={buildingId}
          onChange={onBuildingChange}
          options={buildings}
          placeholder={isRtl ? "اختر المبنى" : "Select building"}
          disabled={loadingBuildings || disabled}
        />
        {loadingBuildings && <p className="text-sm text-muted-foreground mt-1">جار تحميل المباني...</p>}
      </div>

      {buildingId && (
        <div>
          <Label className="text-base font-semibold mb-2 block">
            {isRtl ? "الدور *" : "Floor *"}
          </Label>
          <AdaptiveSelect
            value={floorId}
            onChange={onFloorChange}
            options={floors}
            placeholder={isRtl ? "اختر الدور" : "Select floor"}
            disabled={loadingFloors || disabled}
          />
          {loadingFloors && <p className="text-sm text-muted-foreground mt-1">جار تحميل الأدوار...</p>}
        </div>
      )}

      {floorId && (
        <div>
          <Label className="text-base font-semibold mb-2 block">
            {isRtl ? "الغرفة *" : "Room *"}
          </Label>
          <AdaptiveSelect
            value={roomId}
            onChange={onRoomChange}
            options={rooms}
            placeholder={isRtl ? "اختر الغرفة" : "Select room"}
            disabled={loadingRooms || disabled}
          />
          {loadingRooms && <p className="text-sm text-muted-foreground mt-1">جار تحميل الغرف...</p>}
        </div>
      )}
    </div>
  );
}