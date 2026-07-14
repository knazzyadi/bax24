// src/components/shared/form/ColorPickerField.tsx
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { FormField } from "./FormField";
import { cn } from "@/lib/utils";

export interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function ColorPickerField({
  label,
  value,
  onChange,
  required = false,
  error,
  description,
  disabled = false,
  className,
}: ColorPickerFieldProps) {
  return (
    <FormField label={label} required={required} error={error} description={description} className={className}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value || "#2563eb"}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-11 w-14 cursor-pointer rounded-lg border border-slate-200/50 dark:border-slate-800/50 bg-transparent p-1",
            disabled && "cursor-not-allowed opacity-50"
          )}
        />

        <Input
          value={value}
          disabled={disabled}
          placeholder="#2563eb"
          onChange={(e) => onChange(e.target.value)}
          className="font-mono uppercase"
        />

        <div
          className="h-10 w-10 rounded-lg border border-slate-200/50 dark:border-slate-800/50"
          style={{ backgroundColor: value || "#2563eb" }}
        />
      </div>
    </FormField>
  );
}

export default ColorPickerField;