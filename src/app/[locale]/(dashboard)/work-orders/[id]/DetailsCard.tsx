// src/app/[locale]/(dashboard)/work-orders/[id]/DetailsCard.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { FileText, Tag } from "lucide-react";
import { glassCard } from "../constants";

interface DetailsCardProps {
  workOrder: {
    title: string;
    description: string | null;
    reason: string | null;
    workOrderType: {
      id: string;
      name: string;
      nameEn?: string | null;
    } | null;
  };
  isRtl: boolean;
  t: any;
}

export function DetailsCard({ workOrder, isRtl, t }: DetailsCardProps) {
  return (
    <div className={glassCard}>
      {/* الرأس */}
      <div className="flex flex-row items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
          <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("details")}
        </h3>
        {workOrder.workOrderType && (
          <Badge
            variant="outline"
            className="mr-auto text-sm font-medium border-indigo-200/50 dark:border-indigo-800/30 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
          >
            <Tag className="h-3.5 w-3.5 mr-1.5" />
            {isRtl
              ? workOrder.workOrderType.name
              : workOrder.workOrderType.nameEn || workOrder.workOrderType.name}
          </Badge>
        )}
      </div>

      {/* المحتوى */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("title")}
          </h4>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {workOrder.title}
          </p>
        </div>

        {workOrder.description && (
          <div>
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t("description")}
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {workOrder.description}
            </p>
          </div>
        )}

        {workOrder.reason && (
          <div>
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t("reason")}
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {workOrder.reason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}