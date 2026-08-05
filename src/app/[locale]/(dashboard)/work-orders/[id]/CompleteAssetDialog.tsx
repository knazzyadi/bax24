// src/app/[locale]/(dashboard)/work-orders/[id]/components/CompleteAssetDialog.tsx
"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface SelectedAsset {
  asset: {
    name: string;
    nameEn?: string;
  };
}

interface CompleteAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAsset: SelectedAsset | null;
  completionNote: string;
  onCompletionNoteChange: (value: string) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  isRtl: boolean;
  t: (key: string, values?: Record<string, string>) => string;
}

export function CompleteAssetDialog({
  open,
  onOpenChange,
  selectedAsset,
  completionNote,
  onCompletionNoteChange,
  onConfirm,
  isSubmitting,
  isRtl,
  t,
}: CompleteAssetDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-800 dark:text-slate-100 text-xl font-bold">
            {selectedAsset ? t("completeAssetTitle") : t("completeAllTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
            {selectedAsset
              ? t("completeAssetDescription", {
                  name: isRtl ? selectedAsset.asset.name : selectedAsset.asset.nameEn || selectedAsset.asset.name,
                })
              : t("completeAllDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Textarea
            value={completionNote}
            onChange={(e) => onCompletionNoteChange(e.target.value)}
            placeholder={t("completionNotePlaceholder")}
            className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]"
          />
        </div>
        <AlertDialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}