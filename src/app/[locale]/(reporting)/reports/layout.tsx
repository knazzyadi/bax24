// app/[locale]/reports/layout.tsx
import { ReactNode } from "react";

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">التقارير</h1>
        <p className="text-sm text-muted-foreground">لوحة تحليلية متكاملة</p>
      </div>
      {children}
    </div>
  );
}