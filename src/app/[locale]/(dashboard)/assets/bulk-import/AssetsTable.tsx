// src/app/[locale]/(dashboard)/assets/bulk-import/AssetsTable.tsx
"use client";

import { useCallback, useMemo } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Loader2 } from "lucide-react";
import { AssetRow } from "./AssetRow";
import { TABLE_COLUMNS } from "./tableColumns";
import { formatDateInput } from "./dateHelpers";
import type { AssetType, AssetStatus } from "@/types/assets";
import type { BulkAssetRow } from "./bulkImport.types";

interface AssetsTableProps {
  rows: BulkAssetRow[];
  types: AssetType[];
  statuses: AssetStatus[];
  onUpdateRow: (index: number, field: keyof BulkAssetRow, value: string) => void;
  onRemoveRow: (index: number) => void;
  onAddRow: () => void;
  onUploadFile: () => void;
  csvLoading: boolean;
}

export function AssetsTable({
  rows,
  types,
  statuses,
  onUpdateRow,
  onRemoveRow,
  onAddRow,
  onUploadFile,
  csvLoading,
}: AssetsTableProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // ✅ دالة وسيطة لضمان التوافق مع AssetRow
  const handleUpdateRow = useCallback((index: number, field: keyof BulkAssetRow, value: string) => {
    onUpdateRow(index, field, value);
  }, [onUpdateRow]);

  // ✅ دالة وسيطة للحذف
  const handleRemoveRow = useCallback((index: number) => {
    onRemoveRow(index);
  }, [onRemoveRow]);

  // ✅ تنسيق الأعمدة مع الترجمة
  const columns = useMemo(() => {
    return TABLE_COLUMNS.map((col) => ({
      ...col,
      label: isRtl ? col.labelRtl : col.labelEn,
    }));
  }, [isRtl]);

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isRtl ? "قائمة الأصول" : "Assets List"}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUploadFile}
            disabled={csvLoading}
            className="rounded-xl border-slate-200 dark:border-slate-800"
          >
            {csvLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 ml-1" />
            )}
            {isRtl ? "استيراد CSV" : "Import CSV"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddRow}
            className="rounded-xl border-slate-200 dark:border-slate-800"
          >
            <Plus className="h-4 w-4 ml-1" />
            {isRtl ? "إضافة صف" : "Add Row"}
          </Button>
        </div>
      </div>

      <div className="border border-slate-200/30 dark:border-slate-700/30 rounded-xl overflow-auto max-h-[400px]">
        <div className="min-w-[1200px]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`
                      p-2 text-left font-medium text-slate-500 dark:text-slate-400
                      sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur z-10
                      ${col.width || ""}
                      ${col.key === "actions" ? "text-center" : ""}
                    `}
                  >
                    {col.label}
                    {col.required && <span className="text-rose-500 ml-1">*</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <AssetRow
                  key={row.id}
                  row={row}
                  index={index}
                  types={types}
                  statuses={statuses}
                  updateRow={handleUpdateRow}
                  removeRow={handleRemoveRow}
                  isLastRow={rows.length === 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        {isRtl
          ? `إجمالي الأصول: ${rows.length}`
          : `Total assets: ${rows.length}`}
      </div>
    </div>
  );
}