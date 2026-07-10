// src/app/[locale]/(dashboard)/assets/[id]/components/AssetNotes.tsx
"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { glassCard } from "../constants";

interface AssetNotesProps {
  notes?: string;
}

export function AssetNotes({ notes }: AssetNotesProps) {
  const t = useTranslations("Assets");
  
  if (!notes) return null;

  return (
    <div className={glassCard}>
      <SectionHeader
        icon={<AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
        title={t("notes")}
        iconBgClass="bg-amber-50 dark:bg-amber-950/40"
      />
      <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {notes}
      </div>
    </div>
  );
}