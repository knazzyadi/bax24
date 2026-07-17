// src/app/[locale]/(dashboard)/assets/bulk-import/InstructionsCard.tsx
"use client";

import { useTranslations } from "next-intl";
import { HelpCircle, Info } from "lucide-react";

export function InstructionsCard() {
  const t = useTranslations("BulkImport");

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm sticky top-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
          <HelpCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("instructions.title")}
        </h3>
      </div>

      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex items-start gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold shrink-0 mt-0.5">
            1
          </span>
          <span>{t("instructions.step1")}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold shrink-0 mt-0.5">
            2
          </span>
          <span>{t("instructions.step2")}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold shrink-0 mt-0.5">
            3
          </span>
          <span>{t("instructions.step3")}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold shrink-0 mt-0.5">
            4
          </span>
          <span>{t("instructions.step4")}</span>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/30 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {t("instructions.note")}
        </p>
      </div>
    </div>
  );
}