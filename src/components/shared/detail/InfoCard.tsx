// src/components/shared/detail/InfoCard.tsx
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
          {/* تغيير font-black إلى font-medium */}
          <h3 className="text-lg font-medium tracking-tight">{title}</h3>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}