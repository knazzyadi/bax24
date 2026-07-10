// src/app/[locale]/(dashboard)/assets/[id]/components/AssetLifecycleCard.tsx
"use client";

import { useLocale } from "next-intl";
import { ShieldCheck, Calendar, Clock, Wrench } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { glassCard } from "../constants";
import { formatDate } from "../utils/assetHelpers";
import type { AssetDetail } from "../types";

interface AssetLifecycleCardProps {
  asset: AssetDetail;
}

export function AssetLifecycleCard({ asset }: AssetLifecycleCardProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const {
    purchaseDate,
    operationDate,
    warrantyEnd,
    lastMaintenanceDate,
  } = asset;

  return (
    <div className={glassCard}>
      <SectionHeader
        icon={<ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        title={isRtl ? "دورة الحياة" : "Lifecycle"}
        iconBgClass="bg-blue-50 dark:bg-blue-950/40"
      />
      <div className="space-y-4">
        <div>
          <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {isRtl ? "تاريخ الشراء" : "Purchase Date"}
          </div>
          <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            {formatDate(purchaseDate, isRtl)}
          </p>
        </div>
        <div>
          <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {isRtl ? "تاريخ التشغيل" : "Operation Date"}
          </div>
          <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            {formatDate(operationDate, isRtl)}
          </p>
        </div>
        <div>
          <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {isRtl ? "انتهاء الضمان" : "Warranty End"}
          </div>
          <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            {formatDate(warrantyEnd, isRtl)}
          </p>
        </div>
        <div>
          <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {isRtl ? "آخر صيانة" : "Last Maintenance"}
          </div>
          <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-slate-400" />
            {lastMaintenanceDate
              ? formatDate(lastMaintenanceDate, isRtl)
              : isRtl
              ? "لا توجد"
              : "None"}
          </p>
        </div>
      </div>
    </div>
  );
}