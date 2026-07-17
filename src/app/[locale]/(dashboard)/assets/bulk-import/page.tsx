// src/app/[locale]/(dashboard)/assets/bulk-import/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { useBulkImport } from "./useBulkImport";
import { downloadCSVTemplate } from "./downloadTemplate";
import { BulkImportHeader } from "./BulkImportHeader";
import { LocationSelector } from "./LocationSelector";
import { CsvUploader } from "./CsvUploader";
import { AssetsTable } from "./AssetsTable";
import { SubmitResult } from "./SubmitResult";
import { InstructionsCard } from "./InstructionsCard";
import { BulkImportActions } from "./BulkImportActions";

export default function BulkImportPage() {
  const router = useRouter();
  const t = useTranslations("BulkImport");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const importer = useBulkImport();
  const handleBack = () => router.back();

  if (importer.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (importer.locationError) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <p className="text-rose-600 dark:text-rose-400">{importer.locationError}</p>
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
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      <BulkImportHeader
        onDownloadTemplate={downloadCSVTemplate}
        onBack={handleBack}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <LocationSelector location={importer.location} isRtl={isRtl} />

          {/* ✅ إضافة isRtl إلى CsvUploader */}
          <CsvUploader
            onFileSelect={importer.processCSVFile}
            isLoading={importer.csvLoading}
            error={importer.csvError}
            isRtl={isRtl}
          />

          <AssetsTable
            rows={importer.rows}
            types={importer.types}
            statuses={importer.statuses}
            onUpdateRow={importer.updateRow}
            onRemoveRow={importer.removeRow}
            onAddRow={importer.addRow}
            onUploadFile={importer.uploadFile}
            csvLoading={importer.csvLoading}
          />

          {/* ✅ إضافة isRtl إلى SubmitResult */}
          <SubmitResult result={importer.submitResult} isRtl={isRtl} />

          <BulkImportActions
            submitting={importer.submitting}
            disabled={!importer.location.selectedRoomId || importer.rows.length === 0}
            onBack={handleBack}
            onSubmit={importer.submit}
          />
        </div>

        <div className="lg:col-span-1">
          <InstructionsCard />
        </div>
      </div>
    </div>
  );
}