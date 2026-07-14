// src/components/shared/layout/GlassCard.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
  glass?: boolean;
  bordered?: boolean;
  shadow?: boolean;
  gradient?: boolean;
}

function GlassCard({
  children,
  className,
  hover = true,
  padding = true,
  glass = true,
  bordered = true,
  shadow = true,
  gradient = true,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl transition-all duration-300",
        padding && "p-6",
        glass
          ? "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm"
          : "bg-card",
        bordered && "border border-slate-200/50 dark:border-slate-800/50",
        shadow && "shadow-sm",
        hover && "hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-indigo-400/5",
        className
      )}
    >
      {gradient && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0",
            "bg-gradient-to-br",
            "from-indigo-50/30 to-purple-50/30",
            "dark:from-indigo-950/20 dark:to-purple-950/20",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          )}
        />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Header({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex items-center justify-between gap-4", className)}>
      {children}
    </div>
  );
}

function Body({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}

function Footer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-6 border-t border-slate-200/50 dark:border-slate-800/50 pt-6 flex items-center justify-end gap-3",
        className
      )}
    >
      {children}
    </div>
  );
}

GlassCard.Header = Header;
GlassCard.Body = Body;
GlassCard.Footer = Footer;

export { GlassCard };