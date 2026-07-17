// work-orders/shared/AssetCard.tsx
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
import type { WorkOrderFormData } from "../types";

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
  return (
    <div className="space-y-5">
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
      />

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
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
          className="w-full justify-start gap-2 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12"
        >
          <Plus className="h-4 w-4" />
          {selectedAssetIds.length > 0
            ? `${selectedAssetIds.length} ${t("assetsSelected") || (isRtl ? "أصل محدد" : "assets selected")}`
            : t("selectAssets")}
        </Button>
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100 text-xl font-bold">
              {t("selectAssets")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {loadingAssets ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                {t("noAssets")}
              </div>
            ) : (
              <div className="space-y-2">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
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
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 dark:border-slate-600"
                    />
                    <Label
                      htmlFor={`asset-${asset.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium text-slate-800 dark:text-slate-100">
                        {isRtl ? asset.name : asset.nameEn || asset.name}
                      </div>
                      <div className="text-xs font-mono text-slate-400 dark:text-slate-500">
                        {asset.code}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <Button
              variant="outline"
              onClick={() => onAssetDialogOpenChange(false)}
              className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={onConfirmAssetSelection}
              disabled={loadingAssets}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20"
            >
              <Check className="h-4 w-4 mr-2" />
              {t("confirm") || "تأكيد"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}