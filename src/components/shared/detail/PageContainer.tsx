// src/components/shared/detail/PageContainer.tsx
//إنشاء “حاوية عامة للصفحات” (Page Layout Container) لضبط عرض المحتوى وتوحيد المسافات في كل صفحات النظام.
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("container mx-auto px-4 py-6 max-w-7xl", className)}>
      {children}
    </div>
  );
}