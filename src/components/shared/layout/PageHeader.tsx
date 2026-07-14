// src/components/shared/layout/PageHeader.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  divider?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  footer,
  divider = false,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-6",
        divider && "border-b border-border pb-6",
        className
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          {icon && (
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                "bg-gradient-to-br from-indigo-500/10 to-purple-500/10",
                "border border-indigo-200/30 dark:border-indigo-800/30",
                "shadow-lg shadow-indigo-500/5"
              )}
            >
              {icon}
            </div>
          )}

          <div className="min-w-0">
            <h1
              className={cn(
                "text-2xl font-bold tracking-tight",
                "text-slate-800 dark:text-slate-100"
              )}
            >
              {title}
            </h1>

            {description && (
              <p
                className={cn(
                  "mt-1 text-sm font-medium",
                  "text-slate-500 dark:text-slate-400"
                )}
              >
                {description}
              </p>
            )}

            {footer && <div className="mt-4">{footer}</div>}
          </div>
        </div>

        {actions && (
          <div className={cn("flex flex-wrap items-center gap-3", "lg:justify-end")}>
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export default PageHeader;