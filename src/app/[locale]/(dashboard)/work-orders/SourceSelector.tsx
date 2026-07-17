// src/app/[locale]/(dashboard)/work-orders/components/SourceSelector.tsx
"use client";

import { AlertCircle, Wrench, ClipboardCheck, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export type WorkOrderSource = "ticket" | "pm" | "checklist" | "manual";

const SOURCE_ICONS: Record<WorkOrderSource, React.ReactNode> = {
  ticket: <AlertCircle className="h-4 w-4 text-amber-500" />,
  pm: <Wrench className="h-4 w-4 text-blue-500" />,
  checklist: <ClipboardCheck className="h-4 w-4 text-emerald-500" />,
  manual: <Plus className="h-4 w-4 text-indigo-500" />,
};

const SOURCE_LABELS: Record<WorkOrderSource, { ar: string; en: string }> = {
  ticket: { ar: "بلاغ", en: "Ticket" },
  pm: { ar: "صيانة وقائية", en: "Preventive Maintenance" },
  checklist: { ar: "قائمة فحص", en: "Checklist" },
  manual: { ar: "إنشاء مباشر", en: "Manual" },
};

interface SourceSelectorProps {
  value: WorkOrderSource;
  onChange: (value: WorkOrderSource) => void;
  isRtl: boolean;
  disabled?: boolean;
}

export function WorkOrderSourceSelector({
  value,
  onChange,
  isRtl,
  disabled = false,
}: SourceSelectorProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {isRtl ? "مصدر أمر العمل" : "Work Order Source"} <span className="text-rose-500">*</span>
      </Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as WorkOrderSource)}
        disabled={disabled}
      >
        <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
          <SelectValue placeholder={isRtl ? "اختر المصدر" : "Select source"} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SOURCE_LABELS).map(([key, labels]) => {
            const source = key as WorkOrderSource;
            return (
              <SelectItem key={source} value={source}>
                <div className="flex items-center gap-2">
                  {SOURCE_ICONS[source]}
                  <span>{isRtl ? labels.ar : labels.en}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}