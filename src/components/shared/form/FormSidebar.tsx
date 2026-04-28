// src/components/shared/form/FormSidebar.tsx
//الجزء الجانبي (حفظ / إلغاء)
"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormSidebarProps {
  children: ReactNode;
  className?: string;
}

export function FormSidebar({
  children,
  className,
}: FormSidebarProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-md p-6 space-y-8 sticky top-24 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}