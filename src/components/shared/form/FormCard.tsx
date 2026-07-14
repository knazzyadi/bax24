// src/components/shared/form/FormCard.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/shared/layout/GlassCard";

export interface FormCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  className?: string;
}

export function FormCard({
  children,
  title,
  description,
  icon,
  actions,
  footer,
  noPadding = false,
  className,
}: FormCardProps) {
  return (
    <GlassCard className={className}>
      {(title || description || icon || actions) && (
        <GlassCard.Header>
          <div className="flex flex-1 items-start gap-4">
            {icon && (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </GlassCard.Header>
      )}

      <GlassCard.Body className={cn(noPadding && "space-y-0")}>
        {children}
      </GlassCard.Body>

      {footer && <GlassCard.Footer>{footer}</GlassCard.Footer>}
    </GlassCard>
  );
}

export default FormCard;