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
    return <>{children}</>; // عند تصغير السايدبار، نعرض الأطفال بشكل مباشر (بدون كولابس)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange} className="space-y-1">
      <CollapsibleTrigger
        className={cn(
          "w-full flex items-center justify-between px-4 py-3.5 text-muted-foreground font-bold text-[15px] rounded-2xl hover:bg-primary/10 hover:text-primary transition-all",
          !sidebarOpen && "justify-center px-0"
        )}
      >
        <div className="flex items-center gap-4">
          {triggerIcon}
          <span>{triggerLabel}</span>
        </div>
        <ChevronDown
          size={16}
          className={cn("transition-transform duration-300", isOpen && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 pr-6 border-r-2 border-primary/10 mr-4 animate-in slide-in-from-top-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}