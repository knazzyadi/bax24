// src/app/[locale]/(dashboard)/assets/[id]/components/SectionHeader.tsx
"use client";

import { ReactNode } from "react";

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  iconBgClass?: string;
}

export function SectionHeader({ icon, title, iconBgClass = "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40" }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-2 rounded-xl ${iconBgClass}`}>
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h2>
    </div>
  );
}