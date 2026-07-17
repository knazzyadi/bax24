// src/app/[locale]/(dashboard)/assets/[id]/components/AssetWorkOrders.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Wrench, Clock, AlertCircle } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { glassCard } from "./constants";
import { getDisplayName, formatDate } from "./assetHelpers";

interface WorkOrder {
  id: string;
  title: string;
  createdAt: string;
  status: { name: string; nameEn?: string; color?: string };
  priority: { name: string; nameEn?: string };
}

interface AssetWorkOrdersProps {
  workOrders: WorkOrder[];
  // ✅ locale تم إزالته، يستخدم useLocale() داخلياً
}

export function AssetWorkOrders({ workOrders }: AssetWorkOrdersProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("Assets");

  return (
    <div className={glassCard}>
      <SectionHeader
        icon={<Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        title={t("relatedWorkOrders")}
        iconBgClass="bg-blue-50 dark:bg-blue-950/40"
      />
      {workOrders.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-center py-6">
          {t("noWorkOrders")}
        </p>
      ) : (
        <div className="space-y-4">
          {workOrders.map((wo) => (
            <div
              key={wo.id}
              className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link
                  href={`/${locale}/work-orders/${wo.id}`}
                  className="font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {wo.title}
                </Link>
                <StatusBadge status={wo.status} />
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(wo.createdAt, isRtl)}
                </span>
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {getDisplayName(wo.priority, isRtl)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}