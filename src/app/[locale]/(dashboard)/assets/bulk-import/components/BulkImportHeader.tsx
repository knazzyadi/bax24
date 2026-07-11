// src/app/[locale]/(dashboard)/assets/bulk-import/components/BulkImportHeader.tsx
"use client";

import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ArrowLeft, Download } from "lucide-react";

interface BulkImportHeaderProps {
  isRtl: boolean;
  onDownloadTemplate: () => void;
  onBack: () => void; // ✅ زر العودة
}

export function BulkImportHeader({
  isRtl,
  onDownloadTemplate,
  onBack,
}: BulkImportHeaderProps) {
  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 border border-emerald-200/30 dark:border-emerald-800/30 shadow-lg shadow-emerald-500/5">
          <FileSpreadsheet className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {isRtl ? "إضافة مجموعة أصول" : "Bulk Import Assets"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isRtl
              ? "أضف عدة أصول دفعة واحدة في نفس الموقع"
              : "Add multiple assets at once in the same location"}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onDownloadTemplate}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
        >
          <Download className="h-4 w-4 ml-2" />
          {isRtl ? "تحميل قالب CSV" : "Download CSV Template"}
        </Button>
        <Button
          variant="outline"
          onClick={onBack}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          {isRtl ? "العودة" : "Back"}
        </Button>
      </div>
    </div>
  );
}