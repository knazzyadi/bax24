// src/app/[locale]/(dashboard)/assets/bulk-import/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  FileUp,
  Loader2,
  Save,
  X,
  Plus,
  Trash2,
  MapPin,
  Package,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
import { useAssetTypesAndStatuses } from "./hooks/useAssetTypesAndStatuses";
import { useAssetLocation } from "./hooks/useAssetLocation";
import { useBulkAssets } from "./hooks/useBulkAssets";
import { useCsvImporter } from "./hooks/useCsvImporter";

// =========================
// تنسيقات موحدة
// =========================
const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

export default function BulkImportAssetsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("AssetsForm");
  const isRtl = locale === "ar";

  // Hooks
  const { types, statuses } = useAssetTypesAndStatuses();
  const {
    buildings,
    floors,
    rooms,
    selectedBuildingId,
    selectedFloorId,
    selectedRoomId,
    selectedRoomCode,
    selectedRoomName,
    loadingFloors,
    loadingRooms,
    handleBuildingChange,
    handleFloorChange,
    handleRoomChange,
  } = useAssetLocation();

  const { rows, addRow, removeRow, updateRow, setRowsFromCSV } = useBulkAssets();
  const { uploadFile, isLoading: isUploading } = useCsvImporter(setRowsFromCSV);
  const [isSaving, setIsSaving] = useState(false);

  // دالة مساعدة لتنسيق التاريخ
  const formatDate = (dateStr: unknown): string | null => {
    if (dateStr == null || dateStr === "") return null;
    if (typeof dateStr !== "string") return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split("T")[0];
    } catch {
      return null;
    }
  };

  // دالة لعرض عنوان العمود بدون ترجمة
  const getColumnLabel = (key: string): string => {
    const labels: Record<string, Record<string, string>> = {
      name: { ar: "الاسم", en: "Name" },
      nameEn: { ar: "الاسم بالإنجليزية", en: "Name (English)" },
      description: { ar: "الوصف (عربي)", en: "Description (Arabic)" },
      descriptionEn: { ar: "الوصف (إنجليزي)", en: "Description (English)" },
      type: { ar: "النوع", en: "Type" },
      status: { ar: "الحالة", en: "Status" },
      purchaseDate: { ar: "تاريخ الشراء", en: "Purchase Date" },
      warrantyEnd: { ar: "انتهاء الضمان", en: "Warranty End" },
      lastMaintenance: { ar: "آخر صيانة", en: "Last Maintenance" },
      notes: { ar: "ملاحظات", en: "Notes" },
    };
    const lang = isRtl ? "ar" : "en";
    return labels[key]?.[lang] || key;
  };

  // تحميل قالب CSV
  const downloadTemplate = () => {
    const headers = [
      "name",
      "nameEn",
      "description",
      "descriptionEn",
      "typeId",
      "statusId",
      "purchaseDate",
      "warrantyEnd",
      "lastMaintenanceDate",
      "notes",
    ];
    const exampleStatusId = statuses.length > 0 ? statuses[0].id : "status_id_here";
    const csvContent =
      headers.join(",") +
      `\nExample Asset,Example EN,وصف عربي,English description,type_id_here,${exampleStatusId},2025-01-01,2026-01-01,2025-06-01,notes\n`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "assets_template.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const validateRows = () => {
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].name?.trim()) {
        toast.error(isRtl ? `الصف ${i + 1}: الاسم مطلوب` : `Row ${i + 1}: Name required`);
        return false;
      }
      if (!rows[i].typeId) {
        toast.error(isRtl ? `الصف ${i + 1}: النوع مطلوب` : `Row ${i + 1}: Type required`);
        return false;
      }
    }
    if (!selectedRoomId) {
      toast.error(isRtl ? "يرجى اختيار الغرفة" : "Please select a room");
      return false;
    }
    return true;
  };

  // حفظ جميع الأصول دفعة واحدة
  const saveAll = async () => {
    if (!validateRows()) return;
    setIsSaving(true);

    const assetsToSend = rows.map((row) => ({
      name: row.name.trim(),
      nameEn: row.nameEn?.trim() || null,
      description: row.description?.trim() || null,
      descriptionEn: row.descriptionEn?.trim() || null,
      typeId: row.typeId,
      statusId: row.statusId || null,
      purchaseDate: formatDate(row.purchaseDate),
      warrantyEnd: formatDate(row.warrantyEnd),
      lastMaintenanceDate: formatDate(row.lastMaintenanceDate),
      notes: row.notes || null,
    }));

    try {
      const res = await fetch("/api/assets/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoomId,
          assets: assetsToSend,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "فشل حفظ الأصول");
      }

      const { successCount, failCount, errors } = data;

      if (failCount === 0) {
        toast.success(t("bulkSaveSuccess", { successCount }));
        router.push(`/${locale}/assets`);
        router.refresh();
      } else {
        toast.error(t("bulkSavePartial", { successCount, failCount }));
        if (errors && errors.length > 0) {
          const firstError = errors[0];
          toast.error(
            isRtl
              ? `الصف ${firstError.index + 1}: ${firstError.message}`
              : `Row ${firstError.index + 1}: ${firstError.message}`
          );
        }
        console.error("Bulk save errors:", errors);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.message || (isRtl ? "حدث خطأ أثناء الحفظ" : "An error occurred while saving")
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Upload className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t("bulkImportTitle")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRtl
                ? "استيراد أصول متعددة دفعة واحدة باستخدام ملف CSV"
                : "Import multiple assets at once using CSV file"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          {isRtl ? "العودة" : "Back"}
        </Button>
      </div>

      <div className="space-y-8">
        {/* بطاقة الموقع المشترك */}
        <div className={glassCard}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {isRtl ? "الموقع المشترك" : "Common Location"}{" "}
              <span className="text-rose-500">*</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BuildingSelector
              value={selectedBuildingId}
              onValueChange={handleBuildingChange}
              buildings={buildings}
            />
            <FloorSelector
              value={selectedFloorId}
              onValueChange={handleFloorChange}
              floors={floors}
              buildingId={selectedBuildingId}
              loading={loadingFloors}
            />
            <RoomSelector
              value={selectedRoomId}
              onValueChange={handleRoomChange}
              rooms={rooms}
              floorId={selectedFloorId}
              loading={loadingRooms}
            />
          </div>
          {selectedRoomCode && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {isRtl ? "الموقع المختار:" : "Selected Location:"}
              </span>
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {selectedRoomName} — {selectedRoomCode}
              </span>
            </div>
          )}
        </div>

        {/* بطاقة جدول الأصول */}
        <div className={glassCard}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {isRtl ? "قائمة الأصول" : "Assets List"}
            </h2>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
            >
              <FileUp className="h-4 w-4 ml-2" />
              {t("bulkImportTemplate")}
            </Button>
            <Button
              variant="secondary"
              onClick={uploadFile}
              disabled={isUploading}
              className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {t("bulkUploadCSV")}
            </Button>
            <Button
              onClick={addRow}
              variant="outline"
              className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
            >
              <Plus className="h-4 w-4 ml-2" />
              {t("addRow")}
            </Button>
          </div>

          {/* جدول سطح المكتب */}
          <div className="hidden lg:block border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                <tr>
                  {[
                    "name",
                    "nameEn",
                    "description",
                    "descriptionEn",
                    "type",
                    "status",
                    "purchaseDate",
                    "warrantyEnd",
                    "lastMaintenance",
                    "notes",
                    "",
                  ].map((h) => (
                    <th key={h} className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {getColumnLabel(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {rows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
                    <td className="p-1.5">
                      <Input
                        value={row.name}
                        onChange={(e) => updateRow(idx, "name", e.target.value)}
                        placeholder={t("namePlaceholder")}
                        className="h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm px-3"
                      />
                    </td>
                    <td className="p-1.5">
                      <Input
                        value={row.nameEn}
                        onChange={(e) => updateRow(idx, "nameEn", e.target.value)}
                        placeholder={t("nameEnPlaceholder")}
                        className="h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm px-3"
                      />
                    </td>
                    <td className="p-1.5">
                      <Input
                        value={row.description || ""}
                        onChange={(e) => updateRow(idx, "description", e.target.value)}
                        placeholder={isRtl ? "وصف عربي" : "Arabic description"}
                        className="h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm px-3"
                      />
                    </td>
                    <td className="p-1.5">
                      <Input
                        value={row.descriptionEn || ""}
                        onChange={(e) => updateRow(idx, "descriptionEn", e.target.value)}
                        placeholder={isRtl ? "وصف إنجليزي" : "English description"}
                        className="h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm px-3"
                      />
                    </td>
                    <td className="p-1.5">
                      <select
                        value={row.typeId}
                        onChange={(e) => updateRow(idx, "typeId", e.target.value)}
                        className="w-full h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm px-3 appearance-none"
                      >
                        <option value="" disabled>
                          {t("selectType")}
                        </option>
                        {types.map((t) => (
                          <option key={t.id} value={t.id}>
                            {isRtl ? t.name : t.nameEn || t.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1.5">
                      <select
                        value={row.statusId || ""}
                        onChange={(e) => updateRow(idx, "statusId", e.target.value)}
                        className="w-full h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm px-3 appearance-none"
                      >
                        <option value="" disabled>
                          {t("selectStatus")}
                        </option>
                        {statuses.map((s) => (
                          <option key={s.id} value={s.id}>
                            {isRtl ? s.name : s.nameEn || s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1.5">
                      <Input
                        type="date"
                        value={row.purchaseDate as string}
                        onChange={(e) => updateRow(idx, "purchaseDate", e.target.value)}
                        className="h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm px-3"
                      />
                    </td>
                    <td className="p-1.5">
                      <Input
                        type="date"
                        value={row.warrantyEnd as string}
                        onChange={(e) => updateRow(idx, "warrantyEnd", e.target.value)}
                        className="h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm px-3"
                      />
                    </td>
                    <td className="p-1.5">
                      <Input
                        type="date"
                        value={row.lastMaintenanceDate as string}
                        onChange={(e) => updateRow(idx, "lastMaintenanceDate", e.target.value)}
                        className="h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm px-3"
                      />
                    </td>
                    <td className="p-1.5">
                      <Input
                        value={row.notes}
                        onChange={(e) => updateRow(idx, "notes", e.target.value)}
                        placeholder={t("notesPlaceholder")}
                        className="h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm px-3"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(idx)}
                        className="rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* زر الحفظ الجماعي */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={saveAll}
              disabled={isSaving || !selectedRoomId}
              className="gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {t("bulkSaveAll")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}