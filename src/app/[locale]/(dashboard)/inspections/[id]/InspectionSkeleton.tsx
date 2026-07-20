// src/app/[locale]/(dashboard)/inspections/[id]/InspectionSkeleton.tsx
"use client";

import { Loader2 } from "lucide-react";

export function InspectionSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-500">جاري تحميل الفحص...</p>
      </div>
    </div>
  );
}