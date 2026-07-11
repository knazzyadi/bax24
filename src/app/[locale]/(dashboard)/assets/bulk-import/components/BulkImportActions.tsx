// src/app/[locale]/(dashboard)/assets/bulk-import/components/BulkImportActions.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Loader2, FileSpreadsheet } from "lucide-react";
import { useTranslations } from "next-intl";

interface BulkImportActionsProps {
  submitting: boolean;
  disabled: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export function BulkImportActions({
  submitting,
  disabled,
  onBack,
  onSubmit,
}: BulkImportActionsProps) {
  const t = useTranslations("BulkImport");

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        onClick={onBack}
        className="rounded-xl border-slate-200 dark:border-slate-800 h-12 px-6"
      >
        {t("cancel")}
      </Button>
      <Button
        onClick={onSubmit}
        disabled={disabled || submitting}
        className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20"
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-5 w-5 ml-2" />
        )}
        {t("saveAll")}
      </Button>
    </div>
  );
}