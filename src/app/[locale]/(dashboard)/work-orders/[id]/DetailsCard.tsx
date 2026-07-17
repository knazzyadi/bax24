// src/app/[locale]/(dashboard)/work-orders/[id]/components/DetailsCard.tsx
"use client";

import { FileText, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DetailsCardProps {
  workOrder: {
    type: string;
    title: string;
    description: string | null;
    reason: string | null;
  };
  isRtl: boolean;
  t: any;
}

export function DetailsCard({ workOrder, isRtl, t }: DetailsCardProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "MAINTENANCE":
        return isRtl ? "صيانة" : "Maintenance";
      case "CORRECTIVE":
        return isRtl ? "إصلاح" : "Corrective";
      case "EMERGENCY":
        return isRtl ? "طوارئ" : "Emergency";
      case "BULK_PREVENTIVE":
        return isRtl ? "وقائية مجمعة" : "Bulk Preventive";
      default:
        return type;
    }
  };

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
      {/* عنوان الحاوية */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
          <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isRtl ? "المعلومات الأساسية" : "Basic Information"}
        </h2>
      </div>

      <div className="space-y-5">
        {/* الصف الأول: العنوان + نوع أمر العمل */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              <span className="text-base">📌</span>
              {isRtl ? "العنوان" : "Title"}
            </div>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
              {workOrder.title}
            </p>
          </div>
          <div className="shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 text-right">
              <FileText className="h-3.5 w-3.5" />
              {isRtl ? "نوع الأمر" : "Type"}
            </div>
            <Badge
              variant="outline"
              className="text-sm font-semibold px-4 py-1.5 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30"
            >
              {getTypeLabel(workOrder.type)}
            </Badge>
          </div>
        </div>

        {/* الصف الثاني: الوصف */}
        {workOrder.description && (
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              <span className="text-base">📝</span>
              {isRtl ? "الوصف" : "Description"}
            </div>
            <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {workOrder.description}
            </div>
          </div>
        )}

        {/* الصف الثالث: سبب الإنشاء (بنفس لون الوصف) */}
        {workOrder.reason && (
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              <Info className="h-3.5 w-3.5 text-slate-400" />
              {isRtl ? "سبب الإنشاء" : "Reason for Creation"}
            </div>
            <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {workOrder.reason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}