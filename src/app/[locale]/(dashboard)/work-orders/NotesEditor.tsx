// src/app/[locale]/(dashboard)/work-orders/NotesEditor.tsx
"use client";

import { FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface NotesEditorProps {
  value?: string;  // اختيارية
  onChange: (value: string) => void;
  isRtl: boolean;
  t: any;
}

export function NotesEditor({ value, onChange, isRtl, t }: NotesEditorProps) {
  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
          <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("notes")}
        </h3>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("notesPlaceholder")}
        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 min-h-[120px]"
      />
    </div>
  );
}