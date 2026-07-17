// src/app/[locale]/(dashboard)/work-orders/components/StatusBadge.tsx
"use client";

import { getStatusDisplay } from "./helpers";
import type { WorkOrder } from "./types";

interface StatusBadgeProps {
  status: WorkOrder["status"];
  isRtl: boolean;
  className?: string;
}

export function StatusBadge({ status, isRtl, className }: StatusBadgeProps) {
  const info = getStatusDisplay(status, isRtl);
  const Icon = info.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200/30 dark:border-slate-700/30 shadow-sm ${className || ""}`}
      style={{
        backgroundColor: `${info.hex}20`,
        color: info.hex,
        boxShadow: `0 0 15px ${info.hex}25`,
      }}
    >
      <Icon size={12} />
      {info.label}
    </span>
  );
}