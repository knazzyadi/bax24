// src/components/shared/form/FormField.tsx
//عنصر إدخال مع label + validation
"use client";

import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
  required?: boolean;
  className?: string;
}

export function FormField({ label, icon, children, required, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-foreground font-black text-xs uppercase tracking-widest flex items-center gap-2">
        {icon && <span className="text-foreground">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}