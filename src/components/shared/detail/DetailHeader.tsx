// src/components/shared/detail/DetailHeader.tsx
//إنشاء “هيدر موحد لصفحات التفاصيل” (Detail Page Header) يُستخدم في صفحات عرض البيانات داخل النظام.
import { ReactNode } from "react";

interface DetailHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function DetailHeader({ icon, title, subtitle, actions }: DetailHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tighter">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-2 font-medium">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}