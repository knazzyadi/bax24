// src/components/shared/detail/SidebarCard.tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SidebarCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SidebarCard({ title, icon, children, className }: SidebarCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6 shadow-sm", className)}>
      {(title || icon) && (
        <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
          {icon && <div className="text-primary">{icon}</div>}
          <h3 className="text-lg font-black text-foreground uppercase tracking-widest">
            {title}
          </h3>
        </div>
      )}
      <div className="space-y-3">{children}</div>
    </div>
  );
}