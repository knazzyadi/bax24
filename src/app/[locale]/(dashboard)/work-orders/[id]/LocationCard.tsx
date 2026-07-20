// src/app/[locale]/(dashboard)/work-orders/[id]/LocationCard.tsx
"use client";

interface LocationCardProps {
  room: {
    id: string;
    name: string;
    nameEn?: string;
    floor?: {
      name: string;
      nameEn?: string;
      building?: {
        name: string;
        nameEn?: string;
      };
    };
  } | null;
  isRtl: boolean;
  t: any;
}

export function LocationCard({ room, isRtl, t }: LocationCardProps) {
  if (!room) {
    return (
      <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
        {isRtl ? "لم يتم تحديد موقع" : "No location set"}
      </div>
    );
  }

  const buildingName = room.floor?.building
    ? isRtl
      ? room.floor.building.name
      : room.floor.building.nameEn || room.floor.building.name
    : "";
  const floorName = room.floor
    ? isRtl
      ? room.floor.name
      : room.floor.nameEn || room.floor.name
    : "";
  const roomName = isRtl ? room.name : room.nameEn || room.name;

  return (
    <div className="space-y-1">
      <p className="font-semibold text-slate-800 dark:text-slate-100">{roomName}</p>
      {(floorName || buildingName) && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {[floorName, buildingName].filter(Boolean).join(" - ")}
        </p>
      )}
    </div>
  );
}