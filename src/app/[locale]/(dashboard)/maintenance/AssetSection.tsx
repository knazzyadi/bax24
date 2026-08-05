// src/app/[locale]/(dashboard)/maintenance/components/AssetSection.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Plus, X } from "lucide-react";
import { AssetTypeField } from "@/components/shared/form/AssetTypeField";
import type {
  MaintenanceFormData,
  AssetType,
  Asset,
} from "./types";

interface AssetSectionProps {
  formData: MaintenanceFormData;
  handleAssetTypeChange: (value: string | null) => void;
  assetTypes: AssetType[];
  assets: Asset[];
  selectedAssetIds: string[];
  removeAsset: (id: string) => void;
  loadingAssetTypes: boolean;
  isLocationSelected: () => boolean;
  isRtl: boolean;
  t: (key: string) => string;
  openAssetDialog: () => void;
}

export function AssetSection({
  formData,
  handleAssetTypeChange,
  assetTypes,
  assets,
  selectedAssetIds,
  removeAsset,
  loadingAssetTypes,
  isLocationSelected,
  isRtl,
  t,
  openAssetDialog,
}: AssetSectionProps) {
  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40">
          <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isRtl ? "الأصول (اختياري)" : "Assets (Optional)"}
        </h2>
      </div>

      {/* ✅ وصف توضيحي */}
      <p className="text-sm text-slate-500 mb-4">
        {isRtl
          ? "يمكنك إنشاء جدول صيانة للموقع فقط، أو اختيار نوع أصل، أو تحديد أصول معينة."
          : "You can create a schedule for the location only, filter by asset type, or select specific assets."}
      </p>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {isRtl ? "تصفية حسب نوع الأصل (اختياري)" : "Filter by Asset Type (Optional)"}
          </Label>
          <AssetTypeField
            value={formData.assetTypeId}
            onChange={handleAssetTypeChange}
            assetTypes={assetTypes}
            disabled={!isLocationSelected() || loadingAssetTypes}
            placeholder={
              loadingAssetTypes
                ? isRtl ? "جاري التحميل..." : "Loading..."
                : isLocationSelected()
                ? isRtl ? "اختر نوع الأصل" : "Select asset type"
                : isRtl ? "اختر الموقع أولاً" : "Select location first"
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("selectAssets")}
          </Label>
          <Button
            type="button"
            variant="outline"
            onClick={openAssetDialog}
            disabled={
              !isLocationSelected() ||
              !formData.assetTypeId ||
              assets.length === 0
            }
            className="w-full justify-start gap-2 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12"
          >
            <Plus className="h-4 w-4" />
            {selectedAssetIds.length > 0
              ? `${selectedAssetIds.length} ${t("assetsSelected") || "أصل محدد"}`
              : t("selectAssets")}
          </Button>

          {/* ✅ رسالة إرشادية عند عدم اختيار نوع الأصل */}
          {!formData.assetTypeId && (
            <p className="text-xs text-slate-500 mt-1">
              {isRtl
                ? "اختر نوع الأصل أولاً إذا أردت تحديد أصول معينة."
                : "Select an asset type first if you want to choose specific assets."}
            </p>
          )}
        </div>

        {selectedAssetIds.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {t("selectedAssetsList")}
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedAssetIds.map((assetId) => {
                const asset = assets.find((a) => a.id === assetId);
                if (!asset) return null;
                return (
                  <div
                    key={assetId}
                    className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30"
                  >
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {isRtl ? asset.name : asset.nameEn || asset.name}
                      </p>
                      <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
                        {asset.code}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAsset(assetId)}
                      className="p-1.5 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}