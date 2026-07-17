// [id]/components/SparePartsCard.tsx
"use client";

import { Package } from "lucide-react";
import { WorkOrderInventory } from "@/components/work-order/WorkOrderInventory";

export function SparePartsCard({ workOrderId, locale }: any) {
  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40">
          <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {locale === "ar" ? "قطع الغيار" : "Spare Parts"}
        </h2>
      </div>
      <WorkOrderInventory workOrderId={workOrderId} locale={locale} />
    </div>
  );
}