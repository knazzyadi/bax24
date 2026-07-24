// src/app/[locale]/(dashboard)/inspections/[id]/InspectionHeader.tsx
"use client";

import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Printer,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const t = useTranslations("Inspections");

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {isRtl ? "مسودة" : "Draft"}
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-none">
            {isRtl ? "قيد التنفيذ" : "In Progress"}
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-none">
            {isRtl ? "مكتمل" : "Completed"}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="rounded-full h-10 w-10 p-0 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {title}
            </h1>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
            {locationName && (
              <span className="flex items-center gap-1">
                <span>{isRtl ? "الموقع:" : "Location:"}</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {locationName}
                </span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <span>{isRtl ? "التاريخ:" : "Date:"}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {new Date(scheduledDate).toLocaleDateString(
                  isRtl ? "ar-SA" : "en-US",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* زر الطباعة */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="rounded-xl border-slate-300 dark:border-slate-700 h-9 px-4 gap-2"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">{isRtl ? "طباعة" : "Print"}</span>
        </Button>

        {/* زر الحفظ */}
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="rounded-xl border-slate-300 dark:border-slate-700 h-9 px-4 gap-2"
        >
          <Save className="h-4 w-4" />
          <span>{isRtl ? "حفظ" : "Save"}</span>
        </Button>

        {/* زر الإكمال (يظهر فقط إذا لم تكن الحالة مكتملة) */}
        {status !== "completed" && (
          <Button
            size="sm"
            onClick={onComplete}
            disabled={isSaving || hasFailures}
            className={cn(
              "rounded-xl h-9 px-4 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white",
              hasFailures && "opacity-60 cursor-not-allowed"
            )}
          >
            <CheckCircle className="h-4 w-4" />
            <span>{isRtl ? "إكمال" : "Complete"}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}