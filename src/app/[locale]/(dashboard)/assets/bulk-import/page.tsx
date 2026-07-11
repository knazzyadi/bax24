// src/app/[locale]/(dashboard)/assets/bulk-import/page.tsx
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { useAssetLocation } from "./hooks/useAssetLocation";
import { useAssetTypesAndStatuses } from "./hooks/useAssetTypesAndStatuses";
import { useBulkAssets } from "./hooks/useBulkAssets";
import { useCsvImporter } from "./hooks/useCsvImporter";
import { useBulkImportSubmit } from "./hooks/useBulkImportSubmit";
import { downloadCSVTemplate } from "./utils/downloadTemplate";
import {
  BulkImportHeader,
  LocationSelector,
  CsvUploader,
  AssetsTable,
  SubmitResult,
  InstructionsCard,
  BulkImportActions,
} from "./components";

import type { BulkAssetRow } from "./types/bulkImport.types";

export default function BulkImportPage() {
  const router = useRouter();
  const t = useTranslations("BulkImport");
  // ✅ no need for isRtl here

  // ========== الموقع ==========
  const location = useAssetLocation();

  // ========== الأنواع والحالات ==========
  const { types, statuses, loading: loadingTypesStatuses } =
    useAssetTypesAndStatuses();

  // ========== الأصول (الصفوف) ==========
  const { rows, addRow, removeRow, updateRow, setRowsFromCSV } = useBulkAssets();

  // ========== CSV Importer ==========
  const { uploadFile, processCSVFile, isLoading: csvLoading, error: csvError } =
    useCsvImporter(setRowsFromCSV);

  // ========== تقديم البيانات ==========
  // ✅ useBulkImportSubmit سيتعامل مع الترجمة داخلياً (أو سنمرر t)
  const { submit, submitting, submitResult } =
    useBulkImportSubmit(location.selectedRoomId, rows, t);

  // ========== دوال محسنة بـ useCallback ==========
  const handleUpdateRow = useCallback((index: number, field: keyof BulkAssetRow, value: string) => {
    updateRow(index, field, value);
  }, [updateRow]);

  const handleRemoveRow = useCallback((index: number) => {
    removeRow(index);
  }, [removeRow]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // ========== حالات التحميل ==========
  const isLoading = location.loading || loadingTypesStatuses;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (location.error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <p className="text-rose-600 dark:text-rose-400">{location.error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      <BulkImportHeader
        onDownloadTemplate={downloadCSVTemplate}
        onBack={handleBack}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <LocationSelector location={location} />

          <CsvUploader
            onFileSelect={processCSVFile}
            isLoading={csvLoading}
            error={csvError}
          />

          <AssetsTable
            rows={rows}
            types={types}
            statuses={statuses}
            onUpdateRow={handleUpdateRow}
            onRemoveRow={handleRemoveRow}
            onAddRow={addRow}
            onUploadFile={uploadFile}
            csvLoading={csvLoading}
          />

          <SubmitResult result={submitResult} />

          <BulkImportActions
            submitting={submitting}
            disabled={!location.selectedRoomId || rows.length === 0}
            onBack={handleBack}
            onSubmit={submit}
          />
        </div>

        <div className="lg:col-span-1">
          <InstructionsCard />
        </div>
      </div>
    </div>
  );
}