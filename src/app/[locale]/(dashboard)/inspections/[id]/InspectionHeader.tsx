// src/app/[locale]/(dashboard)/inspections/[id]/InspectionHeader.tsx
"use client";

import Link from "next/link";
import { ArrowLeft, Save, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InspectionHeaderProps {
  title: string;
  locationName?: string;
  scheduledDate: string;
  status: string;
  isRtl: boolean;
  onSave: () => void;
  onComplete: () => void;
  isSaving: boolean;
  hasFailures: boolean;
}

const statusMap: Record<string, { label: { ar: string; en: string }; color: string }> = {
  draft: { label: { ar: "مسودة", en: "Draft" }, color: "bg-slate-100 text-slate-600" },
  in_progress: { label: { ar: "قيد التنفيذ", en: "In Progress" }, color: "bg-blue-100 text-blue-600" },
  completed: { label: { ar: "مكتمل", en: "Completed" }, color: "bg-emerald-100 text-emerald-600" },
  approved: { label: { ar: "معتمد", en: "Approved" }, color: "bg-purple-100 text-purple-600" },
};

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
}: InspectionHeaderProps) {
  const statusInfo = statusMap[status] || statusMap.draft;

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Link href="/inspections">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>{locationName || (isRtl ? "موقع غير محدد" : "Unspecified location")}</span>
            <Badge variant="outline" className="rounded-full">
              {new Date(scheduledDate).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}
            </Badge>
            <Badge className={cn("rounded-full", statusInfo.color)}>
              {isRtl ? statusInfo.label.ar : statusInfo.label.en}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onSave} disabled={isSaving} className="rounded-xl">
          <Save className="h-4 w-4 ml-2" />
          {isRtl ? "حفظ" : "Save"}
        </Button>
        <Button
          onClick={onComplete}
          disabled={isSaving || hasFailures}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
        >
          <CheckCheck className="h-4 w-4 ml-2" />
          {isRtl ? "إنهاء واعتماد" : "Complete & Approve"}
        </Button>
      </div>
    </div>
  );
}