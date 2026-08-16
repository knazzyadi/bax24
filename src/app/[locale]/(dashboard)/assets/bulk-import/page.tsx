// src/app/[locale]/(dashboard)/assets/bulk-import/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

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

  // ─── حالة التحميل ──────────────────────────────────────────
  if (importer.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // ─── حالة الخطأ ──────────────────────────────────────────
  if (importer.locationError) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <p className="text-rose-600 dark:text-rose-400">
          {importer.locationError}
        </p>
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

  // ─── الصفحة الرئيسية ──────────────────────────────────────
  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية ديكورية */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <BulkImportHeader
        onDownloadTemplate={downloadCSVTemplate}
        onBack={handleBack}
      />

      {/* المحتوى الرئيسي */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* العمود الأيسر - المكونات الأساسية */}
        <div className="lg:col-span-3 space-y-6">
          {/* اختيار المبنى */}
          <LocationSelector
            location={importer.location}
            isRtl={isRtl}
          />

          {/* رفع ملف CSV */}
          <CsvUploader
            onFileSelect={importer.processCSVFile}
            isLoading={importer.csvLoading}
            error={importer.csvError}
            isRtl={isRtl}
          />

          {/* جدول الأصول */}
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

          {/* نتيجة التقديم */}
          <SubmitResult result={importer.submitResult} isRtl={isRtl} />

          {/* أزرار الإجراءات */}
          <BulkImportActions
            submitting={importer.submitting}
            disabled={
              !importer.location.selectedBuildingId ||
              importer.rows.length === 0
            }
            onBack={handleBack}
            onSubmit={importer.submit}
          />
        </div>

        {/* العمود الأيمن - بطاقة التعليمات */}
        <div className="lg:col-span-1">
          <InstructionsCard />
        </div>
      </div>
    </div>
  );
}