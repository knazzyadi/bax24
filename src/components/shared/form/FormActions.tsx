// src/components/shared/form/FormActions.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormActionsProps {
  children: React.ReactNode;
  align?: "start" | "center" | "end" | "between";
  divider?: boolean;
  className?: string;
}

const alignments = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

export function FormActions({
  children,
  align = "end",
  divider = true,
  className,
}: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 pt-6",
        divider && "border-t border-slate-200/50 dark:border-slate-800/50",
        alignments[align],
        className
      )}
    >
      {children}
    </div>
  );
}

export default FormActions;