// src/app/[locale]/(dashboard)/assets/[id]/components/AssetMaintenanceHistory.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { History, Calendar } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { glassCard } from "./constants";
import { formatDate } from "./assetHelpers";
import type { MaintenanceRecord } from "./types";

interface AssetMaintenanceHistoryProps {
  history: MaintenanceRecord[];
}

export function AssetMaintenanceHistory({ history }: AssetMaintenanceHistoryProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("Assets");

  return (
    <div className={glassCard}>
      <SectionHeader
        icon={<History className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
        title={t("maintenanceHistory")}
        iconBgClass="bg-purple-50 dark:bg-purple-950/40"
      />
      {history.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-center py-6">
          {t("noMaintenanceRecords")}
        </p>
      ) : (
        <div className="space-y-4">
          {history.map((record) => (
            <div
              key={record.id}
              className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30"
            >
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {record.scheduleName}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(record.executedAt, isRtl)}
                </span>
                {record.workOrderCode && (
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {record.workOrderCode}
                  </span>
                )}
              </div>
              {record.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {record.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}