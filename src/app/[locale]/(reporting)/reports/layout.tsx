// src/app/[locale]/(reporting)/reports/layout.tsx
import { ReactNode } from "react";

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      {children}
    </div>
  );
}