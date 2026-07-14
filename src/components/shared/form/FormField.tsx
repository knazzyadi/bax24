// src/components/shared/form/FormField.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FormField({
  label,
  children,
  description,
  error,
  required = false,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
        <span>{label}</span>
        {required && <span className="text-rose-500">*</span>}
      </label>

      {children}

      {description && !error && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>
      )}

      {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
    </div>
  );
}

export default FormField;