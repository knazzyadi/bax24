"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusBadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "secondary"
  | "primary";


interface StatusBadgeProps {
  label: string;
  variant?: StatusBadgeVariant;
  className?: string;
}


const variants: Record<StatusBadgeVariant, string> = {

  success:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",

  warning:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",

  danger:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",

  secondary:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",

  primary:
    "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",

};



export function StatusBadge({

  label,

  variant = "secondary",

  className,

}: StatusBadgeProps) {


  return (

    <Badge

      variant="outline"

      className={cn(

        "rounded-full px-3 py-1 text-xs font-semibold",

        variants[variant],

        className

      )}

    >

      {label}

    </Badge>

  );

}