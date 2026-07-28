// src/app/[locale]/(dashboard)/inspections/[id]/InspectionHeader.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, CheckCircle, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

interface InspectionHeaderProps {
  title: string;
  locationName?: string;
  scheduledDate: string;
  status: string;
  isRtl: boolean;
  onSave: () => void;
  onComplete: () => void;
  isSaving: boolean;
  hasFailures?: boolean;
  inspectionId: string;
  locale: string;
}

export function InspectionHeader({
  title,
  locationName,
  scheduledDate,
  status,
  isRtl,
  onSave,
  onComplete,
  isSaving,
  hasFailures,
  inspectionId,
  locale,
}: InspectionHeaderProps) {
  const router = useRouter();

  const handlePrint = () => {
  window.open(
    `/${locale}/inspections/${inspectionId}/print`,
    "_blank",
    "noopener,noreferrer"
  );
};

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {locationName && <span>📍 {locationName}</span>}
            <span>📅 {new Date(scheduledDate).toLocaleDateString(isRtl ? "ar" : "en")}</span>
            <Badge variant="outline" className="capitalize">
              {status}
            </Badge>
            {hasFailures && (
              <Badge variant="destructive" className="text-xs">
                ⚠️ {isRtl ? "يوجد بنود غير مطابقة" : "Has failures"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onSave}
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isRtl ? "حفظ" : "Save"}
        </Button>

        <Button
          variant="outline"
          onClick={handlePrint}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          {isRtl ? "طباعة" : "Print"}
        </Button>

        <Button
          onClick={onComplete}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          {isRtl ? "إكمال الفحص" : "Complete"}
        </Button>
      </div>
    </div>
  );
}