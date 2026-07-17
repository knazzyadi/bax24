// NotesSection.tsx
"use client";

import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

export function NotesSection({ formData, setFormData, isRtl, t }: any) {
  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
          <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("notes")}
        </h3>
      </div>
      <Textarea
        value={formData.notes}
        onChange={(e) =>
          setFormData({ ...formData, notes: e.target.value })
        }
        placeholder={t("notesPlaceholder")}
        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[120px]"
      />
    </>
  );
}