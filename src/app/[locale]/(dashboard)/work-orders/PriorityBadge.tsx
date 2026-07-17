// src/app/[locale]/(dashboard)/work-orders/components/PriorityBadge.tsx
"use client";

import { getPriorityDisplay } from "./helpers";
import type { WorkOrder } from "./types";

interface PriorityBadgeProps {
  priority: WorkOrder["priority"];
  isRtl: boolean;
  className?: string;
}

export function PriorityBadge({ priority, isRtl, className }: PriorityBadgeProps) {
  const info = getPriorityDisplay(priority, isRtl);
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