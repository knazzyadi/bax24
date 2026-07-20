// src/app/[locale]/(dashboard)/inspections/[id]/InspectionBasicInfo.tsx
"use client";

import { useLocale } from "next-intl";
import { Calendar, MapPin, User, ClipboardCheck } from "lucide-react";

interface InspectionBasicInfoProps {
  inspection: any;
}

export function InspectionBasicInfo({ inspection }: InspectionBasicInfoProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const items = [
    {
      icon: MapPin,
      label: isRtl ? "الموقع" : "Location",
      value: inspection.locationName || (isRtl ? "غير محدد" : "Unspecified"),
    },
    {
      icon: Calendar,
      label: isRtl ? "تاريخ الفحص" : "Date",
      value: new Date(inspection.scheduledDate).toLocaleDateString(isRtl ? "ar-SA" : "en-US"),
    },
    {
      icon: User,
      label: isRtl ? "المفتش" : "Inspector",
      value: inspection.inspectorName || (isRtl ? "غير محدد" : "Unspecified"),
    },
    {
      icon: ClipboardCheck,
      label: isRtl ? "إجمالي البنود" : "Total Items",
      value: inspection._count?.totalItems || 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20">
            <item.icon className="h-4 w-4 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="text-sm font-medium text-slate-700">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}