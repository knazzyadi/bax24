// src/components/shared/layout/PageContainer.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps {
  children: React.ReactNode;
  background?: boolean;
  padding?: boolean;
  maxWidth?: "full" | "7xl" | "6xl" | "5xl" | "4xl" | "3xl";
  spacing?: "none" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const widthMap = {
  full: "max-w-full",
  "7xl": "max-w-7xl",
  "6xl": "max-w-6xl",
  "5xl": "max-w-5xl",
  "4xl": "max-w-4xl",
  "3xl": "max-w-3xl",
};

const spacingMap = {
  none: "space-y-0",
  sm: "space-y-4",
  md: "space-y-6",
  lg: "space-y-8",
  xl: "space-y-10",
};

export function PageContainer({
  children,
  background = true,
  padding = true,
  maxWidth = "full",
  spacing = "lg",
  className,
}: PageContainerProps) {
  return (
    <div className="relative w-full min-h-screen">
      {/* خلفية متدرجة خفيفة (مطابقة لـ Dashboard) */}
      {background && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 rounded-3xl",
            "bg-gradient-to-br",
            "from-indigo-100/20 via-transparent to-purple-100/20",
            "dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10"
          )}
        />
      )}

      <div
        className={cn(
          "mx-auto w-full",
          widthMap[maxWidth],
          spacingMap[spacing],
          padding && "p-6",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default PageContainer;