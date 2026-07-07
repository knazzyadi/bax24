// AssetDialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AssetDialog({
  open,
  onClose,
  onConfirm,
  assets,
  tempSelectedAssetIds,
  setTempSelectedAssetIds,
  loadingAssets,
  isRtl,
  t,
}: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
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
              {assets.map((asset: any) => (
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
                        setTempSelectedAssetIds((prev: string[]) => [
                          ...prev,
                          asset.id,
                        ]);
                      } else {
                        setTempSelectedAssetIds((prev: string[]) =>
                          prev.filter((id) => id !== asset.id)
                        );
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
            onClick={onClose}
            className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loadingAssets}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20"
          >
            <Check className="h-4 w-4 mr-2" />
            {t("confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}