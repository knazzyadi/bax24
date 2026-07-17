// src/app/[locale]/(dashboard)/assets/[id]/components/AssetLocationCard.tsx
"use client";

import { useLocale } from "next-intl";
import { MapPin, Building, Layers, DoorOpen } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { glassCard } from "./constants";
import { getDisplayName } from "./assetHelpers";

interface AssetLocationCardProps {
  room?: {
    floor?: {
      building?: {
        branch?: { name: string; nameEn?: string };
        name: string;
        nameEn?: string;
      };
      name: string;
      nameEn?: string;
    };
    name: string;
    nameEn?: string;
    code?: string;
  };
}

export function AssetLocationCard({ room }: AssetLocationCardProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  if (!room) return null;

  return (
    <div className={glassCard}>
      <SectionHeader
        icon={<MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        title={isRtl ? "الموقع" : "Location"}
        iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
      />
      <div className="space-y-3">
        {room.floor?.building?.branch && (
          <div className="flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 text-indigo-400" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {getDisplayName(room.floor.building.branch, isRtl)}
            </span>
          </div>
        )}
        {room.floor?.building && (
          <div className="flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 text-indigo-400" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {getDisplayName(room.floor.building, isRtl)}
            </span>
          </div>
        )}
        {room.floor && (
          <div className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {getDisplayName(room.floor, isRtl)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <DoorOpen className="h-4 w-4 text-indigo-400" />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {getDisplayName(room, isRtl)}
            {room.code && ` (${room.code})`}
          </span>
        </div>
      </div>
    </div>
  );
}