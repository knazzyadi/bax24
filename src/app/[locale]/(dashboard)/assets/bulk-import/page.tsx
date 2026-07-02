"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Upload, FileUp, Loader2, Save, X, Plus, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
import { useAssetTypesAndStatuses } from "./hooks/useAssetTypesAndStatuses";
import { useAssetLocation } from "./hooks/useAssetLocation";
import { useBulkAssets } from "./hooks/useBulkAssets";
import { useCsvImporter } from "./hooks/useCsvImporter";
import { toast } from "sonner";

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

  // تحميل قالب CSV (مع إضافة عمودي الوصف)
  const downloadTemplate = () => {
    const headers = ["name", "nameEn", "description", "descriptionEn", "typeId", "statusId", "purchaseDate", "warrantyEnd", "lastMaintenanceDate", "notes"];
    const exampleStatusId = statuses.length > 0 ? statuses[0].id : "status_id_here";
    const csvContent = headers.join(",") + `\nExample Asset,Example EN,وصف عربي,English description,type_id_here,${exampleStatusId},2025-01-01,2026-01-01,2025-06-01,notes\n`;
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
      description: row.description?.trim() || null,        // ✅ وصف عربي
      descriptionEn: row.descriptionEn?.trim() || null,    // ✅ وصف إنجليزي
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
      toast.error(err.message || (isRtl ? "حدث خطأ أثناء الحفظ" : "An error occurred while saving"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer>
      <DetailHeader
        icon={<Upload size={28} />}
        title={t("bulkImportTitle")}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <X className="h-4 w-4" /> {t("back")}
          </Button>
        }
      />
      <div className="space-y-8">
        {/* بطاقة الموقع المشترك */}
        <InfoCard title={isRtl ? "الموقع المشترك" : "Common Location"} icon={<></>}>
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
            <p className="text-sm text-primary mt-2">
              {selectedRoomName} — {selectedRoomCode}
            </p>
          )}
        </InfoCard>

        {/* بطاقة جدول الأصول */}
        <InfoCard title={isRtl ? "قائمة الأصول" : "Assets List"} icon={<></>}>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="outline" onClick={downloadTemplate}>
              <FileUp className="h-4 w-4" /> {t("bulkImportTemplate")}
            </Button>
            <Button variant="secondary" onClick={uploadFile} disabled={isUploading}>
              {isUploading ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
              {t("bulkUploadCSV")}
            </Button>
            <Button onClick={addRow} variant="outline">
              <Plus className="h-4 w-4" /> {t("addRow")}
            </Button>
          </div>

          {/* جدول سطح المكتب */}
          <div className="hidden lg:block border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {["name", "nameEn", "description", "descriptionEn", "type", "status", "purchaseDate", "warrantyEnd", "lastMaintenance", "notes", ""].map((h) => (
                    <th key={h} className="p-2 text-left">
                      {t(h) || h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="p-1">
                      <input
                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={row.name}
                        onChange={(e) => updateRow(idx, "name", e.target.value)}
                        placeholder={t("namePlaceholder")}
                      />
                    </td>
                    <td className="p-1">
                      <input
                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={row.nameEn}
                        onChange={(e) => updateRow(idx, "nameEn", e.target.value)}
                        placeholder={t("nameEnPlaceholder")}
                      />
                    </td>
                    <td className="p-1">
                      <input
                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={row.description || ""}
                        onChange={(e) => updateRow(idx, "description", e.target.value)}
                        placeholder={isRtl ? "وصف عربي" : "Arabic description"}
                      />
                    </td>
                    <td className="p-1">
                      <input
                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={row.descriptionEn || ""}
                        onChange={(e) => updateRow(idx, "descriptionEn", e.target.value)}
                        placeholder={isRtl ? "وصف إنجليزي" : "English description"}
                      />
                    </td>
                    <td className="p-1">
                      <select
                        value={row.typeId}
                        onChange={(e) => updateRow(idx, "typeId", e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                    <td className="p-1">
                      <select
                        value={row.statusId || ""}
                        onChange={(e) => updateRow(idx, "statusId", e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                    <td className="p-1">
                      <input
                        type="date"
                        value={row.purchaseDate as string}
                        onChange={(e) => updateRow(idx, "purchaseDate", e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="date"
                        value={row.warrantyEnd as string}
                        onChange={(e) => updateRow(idx, "warrantyEnd", e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="date"
                        value={row.lastMaintenanceDate as string}
                        onChange={(e) => updateRow(idx, "lastMaintenanceDate", e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        value={row.notes}
                        onChange={(e) => updateRow(idx, "notes", e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder={t("notesPlaceholder")}
                      />
                    </td>
                    <td className="p-1 text-center">
                      <Button variant="ghost" size="icon" onClick={() => removeRow(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* زر الحفظ الجماعي */}
          <div className="flex justify-end mt-4">
            <Button onClick={saveAll} disabled={isSaving || !selectedRoomId} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t("bulkSaveAll")}
            </Button>
          </div>
        </InfoCard>
      </div>
    </PageContainer>
  );
}