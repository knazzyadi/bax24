// src/components/shared/GlassCard.tsx
"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export function GlassCard({
  children,
  className,
  hover = true,
  gradient = true,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 backdrop-blur-sm transition-all duration-300",
        "bg-white/60 dark:bg-slate-900/60",
        "border border-slate-200/50 dark:border-slate-800/50",
        gradient && "before:absolute before:inset-0 before:bg-gradient-to-br before:from-indigo-100/20 before:via-transparent before:to-purple-100/20 before:dark:from-indigo-950/10 before:dark:via-transparent before:dark:to-purple-950/10 before:-z-10",
        hover && "hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-slate-800/30",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}