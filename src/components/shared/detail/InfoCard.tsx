// src/components/shared/detail/InfoCard.tsx
//إنشاء “بطاقة معلومات (Info Card)” جاهزة تُستخدم لعرض البيانات بشكل منظم داخل صفحات التفاصيل
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InfoCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function InfoCard({ title, icon, children, className }: InfoCardProps) {
  return (
    <div className={cn("bg-card border border-border rounded-2xl p-6 shadow-sm", className)}>
      {title && (
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <h3 className="text-lg font-black tracking-tight">{title}</h3>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}