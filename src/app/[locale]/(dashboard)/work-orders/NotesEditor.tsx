// src/app/[locale]/(dashboard)/work-orders/NotesEditor.tsx
"use client";

import { FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface NotesEditorProps {
  value?: string;
  onChange: (value: string) => void;
  t: (key: string) => string;
}

export function NotesEditor({ value, onChange, t }: NotesEditorProps) {
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40">
          <FileText className="h-5 w-5 text-amber-700 dark:text-amber-300" />
        </div>

        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("notes")}
        </h3>
      </div>

      <Textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("notesPlaceholder")}
        className="w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-900/90 focus:ring-2 focus:ring-indigo-500/60 transition-all p-4 min-h-[140px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-y"
      />
    </div>
  );
}