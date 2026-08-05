// src/components/shared/form/StatusSwitch.tsx
"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { FormField } from "./FormField";

export interface StatusSwitchProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
  activeText?: string;
  inactiveText?: string;
  className?: string;
}

export function StatusSwitch({
  label,
  checked,
  onCheckedChange,
  description,
  disabled = false,
  activeText = "نشط",
  inactiveText = "غير نشط",
  className,
}: StatusSwitchProps) {
  return (
    <FormField label={label} description={description} className={className}>
      <div className="flex items-center justify-between rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {checked ? activeText : inactiveText}
          </p>
          {description && (
            <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>
          )}
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      </div>
    </FormField>
  );
}

export default StatusSwitch;