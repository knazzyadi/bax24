// src/app/[locale]/(dashboard)/assets/[id]/components/AssetError.tsx
"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssetErrorProps {
  error?: string;
}

export function AssetError({ error }: AssetErrorProps) {
  const router = useRouter();
  const t = useTranslations("Assets");
  const locale = useLocale();

  return (
    <div className="relative p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400">{error || t("assetNotFound")}</p>
        <Button
          onClick={() => router.push(`/${locale}/assets`)}
          className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20"
        >
          {t("backToAssets")}
        </Button>
      </div>
    </div>
  );
}