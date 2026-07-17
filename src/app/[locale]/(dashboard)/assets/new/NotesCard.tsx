// src/app/[locale]/(dashboard)/assets/new/NotesCard.tsx
"use client";

import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";
import type { NewAssetFormData } from "./types";

interface NotesCardProps {
  formData: NewAssetFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  t: any;
}

export function NotesCard({ formData, handleChange, t }: NotesCardProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("notes")}
        </h3>
      </div>

      <Textarea
        name="notes"
        value={formData.notes || ""}
        onChange={handleChange}
        placeholder={t("notesPlaceholder")}
        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[120px]"
      />

      <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
        <Info className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
          {t("infoText")}
        </p>
      </div>
    </div>
  );
}