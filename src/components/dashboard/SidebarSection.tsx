// src/components/dashboard/SidebarSection.tsx
"use client";

import { ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarSectionProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  triggerIcon: ReactNode;
  triggerLabel: string;
  children: ReactNode;
  sidebarOpen: boolean;
}

export function SidebarSection({
  isOpen,
  onOpenChange,
  triggerIcon,
  triggerLabel,
  children,
  sidebarOpen,
}: SidebarSectionProps) {
  if (!sidebarOpen) {
    return <>{children}</>;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange} className="space-y-0.5">
      <CollapsibleTrigger
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-slate-600 dark:text-slate-400 font-bold text-[15px] rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all",
          !sidebarOpen && "justify-center px-0"
        )}
      >
        <div className="flex items-center gap-4">
          <span className="text-slate-500 dark:text-slate-400">{triggerIcon}</span>
          <span>{triggerLabel}</span>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "text-slate-400 dark:text-slate-500 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 pl-3 border-l-2 border-indigo-200 dark:border-indigo-800/50 ml-4 animate-in slide-in-from-top-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}