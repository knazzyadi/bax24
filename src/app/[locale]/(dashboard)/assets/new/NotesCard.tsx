// src/app/[locale]/(dashboard)/assets/new/NotesCard.tsx

"use client";

import type { ChangeEvent } from "react";

import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";

import type { NewAssetFormData } from "./types";

type Translator = (key: string) => string;

interface NotesCardProps {
  formData: NewAssetFormData;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  t: Translator;
}

export function NotesCard({
  formData,
  handleChange,
  t,
}: NotesCardProps) {
  return (
    <div className="space-y-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-amber-50 p-2 dark:bg-amber-950/40">
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
        className="min-h-[120px] rounded-xl border-slate-200 bg-white/50 p-4 transition-all focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900/50"
      />

      <div className="flex items-start gap-3 rounded-xl border border-indigo-200/30 bg-indigo-50/50 p-4 dark:border-indigo-800/30 dark:bg-indigo-950/20">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />

        <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">
          {t("infoText")}
        </p>
      </div>
    </div>
  );
}