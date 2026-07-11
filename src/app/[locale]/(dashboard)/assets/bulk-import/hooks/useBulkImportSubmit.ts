// src/app/[locale]/(dashboard)/assets/bulk-import/hooks/useBulkImportSubmit.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { BulkAssetRow } from "../types/bulkImport.types";

interface BulkImportResponse {
  success: boolean;
  successCount: number;
  failCount: number;
  errors: { index: number; assetName?: string; message: string }[];
  error?: string;
}

export function useBulkImportSubmit(
  selectedRoomId: string,
  rows: BulkAssetRow[]
) {
  const t = useTranslations("BulkImport");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    successCount: number;
    failCount: number;
    errors: any[];
  } | null>(null);

  const submit = useCallback(async () => {
    if (!selectedRoomId) {
      toast.error(t("selectRoomFirst"));
      return;
    }

    const invalidRows = rows.filter((row) => !row.name.trim() || !row.typeId);
    if (invalidRows.length > 0) {
      toast.error(t("allRowsNeedNameAndType"));
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const payload = {
        roomId: selectedRoomId,
        assets: rows.map((row) => ({
          name: row.name.trim(),
          nameEn: row.nameEn?.trim() || null,
          description: row.description?.trim() || null,
          typeId: row.typeId,
          statusId: row.statusId || null,
          purchaseDate: row.purchaseDate || null,
          operationDate: row.operationDate || null,
          warrantyEnd: row.warrantyEnd || null,
          lastMaintenanceDate: row.lastMaintenanceDate || null,
          serialNumber: row.serialNumber?.trim() || null,
          manufacturer: row.manufacturer?.trim() || null,
          model: row.model?.trim() || null,
          supplier: row.supplier?.trim() || null,
          notes: row.notes?.trim() || null,
        })),
      };

      const res = await fetch("/api/assets/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as BulkImportResponse;

      if (res.ok) {
        setSubmitResult({
          successCount: data.successCount || 0,
          failCount: data.failCount || 0,
          errors: data.errors || [],
        });
        // ✅ استخدام الترجمة مع معامل count
        toast.success(t("successMessage", { count: data.successCount }));
        if (data.failCount > 0) {
          toast.warning(t("failureMessage", { count: data.failCount }));
        }
      } else {
        toast.error(data.error || t("errorOccurred"));
        setSubmitResult({
          successCount: 0,
          failCount: rows.length,
          errors: [{ message: data.error || t("unknownError") }],
        });
      }
    } catch (err) {
      console.error(err);
      toast.error(t("serverError"));
      setSubmitResult({
        successCount: 0,
        failCount: rows.length,
        errors: [{ message: t("connectionError") }],
      });
    } finally {
      setSubmitting(false);
    }
  }, [selectedRoomId, rows, t]);

  return { submit, submitting, submitResult };
}