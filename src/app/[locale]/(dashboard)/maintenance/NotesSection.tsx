// src/app/[locale]/(dashboard)/maintenance/components/NotesSection.tsx

"use client";

import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";
import type { MaintenanceFormData } from "./types";

interface NotesSectionProps {
  formData: MaintenanceFormData;
  handleNotesChange: (value: string) => void;
  t: (key: string) => string;
}

export function NotesSection({
  formData,
  handleNotesChange,
  t,
}: NotesSectionProps) {
  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-amber-50 p-2 dark:bg-amber-950/40">
          <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>

        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("notes")}
        </h3>
      </div>

      <Textarea
        value={formData.notes}
        onChange={(e) => handleNotesChange(e.target.value)}
        placeholder={t("notesPlaceholder")}
        className="min-h-[120px] rounded-xl border-slate-200 bg-white/50 transition-all focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900/50"
      />
    </>
  );
}