// src/app/[locale]/(dashboard)/assets/[id]/components/AssetBasicInfo.tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import { FileText } from "lucide-react";
import { InfoField } from "./InfoField";
import { SectionHeader } from "./SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { glassCard, iconBgColors } from "./constants";
import { getDisplayName } from "./assetHelpers";
import type { AssetDetail } from "./types";

interface AssetBasicInfoProps {
  asset: AssetDetail;
}

export function AssetBasicInfo({ asset }: AssetBasicInfoProps) {
  const t = useTranslations("Assets");
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <div className={glassCard}>
      <SectionHeader
        icon={<FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
        title={t("basicInfo")}
        iconBgClass={iconBgColors.basic}
      />
      <div className="grid sm:grid-cols-2 gap-5">
        <InfoField label={t("name")} value={asset.name} />
        {asset.nameEn && <InfoField label={t("nameEn")} value={asset.nameEn} />}
        <InfoField label={t("code")} value={asset.code} />
        <InfoField 
          label={t("type")} 
          value={asset.type ? getDisplayName(asset.type, isRtl) : t("notSpecified")} 
        />
        <InfoField
          label={t("status")}
          value={<StatusBadge status={asset.status ?? null} />}
        />
        {asset.description && (
          <div className="sm:col-span-2 space-y-1">
            <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {t("description")}
            </div>
            <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {asset.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}