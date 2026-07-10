// src/app/[locale]/(dashboard)/assets/[id]/components/AssetHeader.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import AssetActions from "../AssetActions";
import { getDisplayName } from "../utils/assetHelpers";
import type { AssetDetail } from "../types";

interface AssetHeaderProps {
  asset: AssetDetail;
  canEdit: boolean;
  canDelete: boolean;
}

export function AssetHeader({ asset, canEdit, canDelete }: AssetHeaderProps) {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("Assets");

  // ✅ عرض الاسم باستخدام الدالة المساعدة
  const name = getDisplayName(asset, isRtl);

  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
          <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRtl ? "الكود" : "Code"}: {asset.code}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <AssetActions
          assetId={asset.id}
          locale={locale}
          canEdit={canEdit}
          canDelete={canDelete}
        />
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          {t("back")}
        </Button>
      </div>
    </div>
  );
}