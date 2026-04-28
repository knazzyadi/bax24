// src/components/shared/form/FormPageContainer.tsx
//إنشاء “قالب صفحة فورم جاهز” (Form Page Layout) يُستخدم لتوحيد شكل صفحات الإدخال داخل النظام
"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormPageContainerProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function FormPageContainer({
  icon,
  title,
  subtitle,
  children,
  actions,
}: FormPageContainerProps) {
  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-4xl font-black tracking-tighter">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground mt-2 font-medium">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div>{actions}</div>}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">{children}</div>
    </div>
  );
}