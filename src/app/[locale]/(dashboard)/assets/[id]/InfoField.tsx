// src/app/[locale]/(dashboard)/assets/[id]/components/InfoField.tsx
"use client";

import { ReactNode } from "react";

interface InfoFieldProps {
  label: string;
  value?: ReactNode; // ✅ دعم أي نوع من React (نص، مكون، JSX)
  icon?: ReactNode;
  className?: string;
}

export function InfoField({ label, value, icon, className }: InfoFieldProps) {
  return (
    <div className={className}>
      <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-semibold text-slate-800 dark:text-slate-100">
        {value ?? "—"}
      </div>
    </div>
  );
}