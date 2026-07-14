// src/components/shared/form/FormSection.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  divider?: boolean;
  className?: string;
  contentClassName?: string;
}

export function FormSection({
  children,
  title,
  description,
  icon,
  actions,
  divider = true,
  className,
  contentClassName,
}: FormSectionProps) {
  return (
    <section className={cn("space-y-6", className)}>
      {(title || description || icon || actions) && (
        <div
          className={cn(
            "flex items-start justify-between gap-4",
            divider && "border-b border-slate-200/50 dark:border-slate-800/50 pb-5"
          )}
        >
          <div className="flex items-start gap-3">
            {icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400">
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className={cn("grid gap-6", contentClassName)}>{children}</div>
    </section>
  );
}

export default FormSection;