// src/app/[locale]/(dashboard)/work-orders/AssetCard.tsx
"use client";

import { FileText, Plus, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AssetTypeField } from "@/components/shared/form/AssetTypeField";
import type { WorkOrderFormData } from "./types";

interface AssetCardProps {
  formData: WorkOrderFormData;
  setFormData: (data: WorkOrderFormData) => void;
  assetTypes: any[];
  assets: any[];
  selectedAssetIds: string[];
  loadingAssets: boolean;
  assetDialogOpen: boolean;
  tempSelectedAssetIds: string[];
  onOpenAssetDialog: () => void;
  onConfirmAssetSelection: () => void;
  onRemoveAsset: (id: string) => void;
  onTempAssetChange: (ids: string[]) => void;
  onAssetDialogOpenChange: (open: boolean) => void;
  isLocationSelected: boolean;
  isRtl: boolean;
  t: any;
}

// دالة مساعدة لعرض اسم الأصل مع الكود
const getAssetDisplay = (asset: any, isRtl: boolean) => {
  const name = isRtl ? asset.name : (asset.nameEn || asset.name);
  return asset.code ? `${asset.code}. ${name}` : name;
};

export function AssetCard({
  formData,
  setFormData,
  assetTypes,
  assets,
  selectedAssetIds,
  loadingAssets,
  assetDialogOpen,
  tempSelectedAssetIds,
  onOpenAssetDialog,
  onConfirmAssetSelection,
  onRemoveAsset,
  onTempAssetChange,
  onAssetDialogOpenChange,
  isLocationSelected,
  isRtl,
  t,
}: AssetCardProps) {
  // عرض خيارات الأصول مع التنسيق المحسن
  const getAssetLabel = (asset: any) => {
    const name = isRtl ? asset.name : (asset.nameEn || asset.name);
    return asset.code ? `${asset.code}. ${name}` : name;
  };

  return (
    <div className="space-y-5">
      {/* نوع الأصل */}
      <AssetTypeField
        value={formData.assetTypeId}
        onChange={(val) =>
          setFormData({ ...formData, assetTypeId: val ?? "" })
        }
        assetTypes={assetTypes}
        disabled={!isLocationSelected}
        placeholder={
          isLocationSelected
            ? isRtl ? "اختر نوع الأصل" : "Select asset type"
            : isRtl ? "اختر الموقع أولاً" : "Select location first"
        }
        isRtl={isRtl}
        className="w-full"
      />

      {/* اختيار الأصول */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t("selectAssets")}
        </Label>
        <Button
          type="button"
          variant="outline"
          onClick={onOpenAssetDialog}
          disabled={
            !isLocationSelected ||
            !formData.assetTypeId ||
            assets.length === 0
          }
          className="w-full justify-start gap-3 rounded-xl border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 h-12 font-medium transition-all"
        >
          <Plus className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          {selectedAssetIds.length > 0
            ? `${selectedAssetIds.length} ${isRtl ? "أصل محدد" : "assets selected"}`
            : t("selectAssets")}
        </Button>
      </div>

      {/* عرض الأصول المختارة */}
      {selectedAssetIds.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {t("selectedAssetsList") || (isRtl ? "الأصول المختارة" : "Selected Assets")}
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selectedAssetIds.map((assetId) => {
              const asset = assets.find((a) => a.id === assetId);
              if (!asset) return null;
              return (
                <div
                  key={assetId}
                  className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/40"
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {getAssetDisplay(asset, isRtl)}
                    </p>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {asset.code}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveAsset(assetId)}
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

      {/* حوار اختيار الأصول */}
      <Dialog open={assetDialogOpen} onOpenChange={onAssetDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100 text-xl font-bold">
              {t("selectAssets")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {loadingAssets ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                {t("noAssets") || (isRtl ? "لا توجد أصول متاحة" : "No assets available")}
              </div>
            ) : (
              <div className="space-y-2">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={`asset-${asset.id}`}
                      checked={tempSelectedAssetIds.includes(asset.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onTempAssetChange([...tempSelectedAssetIds, asset.id]);
                        } else {
                          onTempAssetChange(tempSelectedAssetIds.filter((id) => id !== asset.id));
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 rounded border-slate-300 dark:border-slate-600"
                    />
                    <Label
                      htmlFor={`asset-${asset.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {getAssetLabel(asset)}
                      </div>
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {asset.code}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
            <Button
              variant="outline"
              onClick={() => onAssetDialogOpenChange(false)}
              className="rounded-xl border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={onConfirmAssetSelection}
              disabled={loadingAssets}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium shadow-md hover:shadow-lg transition-all"
            >
              <Check className="h-4 w-4 mr-2" />
              {t("confirm") || (isRtl ? "تأكيد" : "Confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}