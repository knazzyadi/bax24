// src/components/shared/form/FormSection.tsx
//تقسيم النموذج إلى أجزاء
"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  icon,
  title,
  children,
  className,
}: FormSectionProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-md p-6 space-y-6 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center gap-2 px-1 text-foreground">
        {icon && <span className="text-foreground">{icon}</span>}
        <span className="font-black text-xs uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </div>
  );
}