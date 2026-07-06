// src/components/dashboard/SidebarNavItem.tsx
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isOpen: boolean;
  isActive?: boolean;
  subItem?: boolean;
  locale: string;
  badgeCount?: number;
}

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isOpen,
  isActive,
  subItem,
  locale,
  badgeCount,
}: SidebarNavItemProps) {
  const finalHref = `/${locale}${href}`;
  return (
    <Link
      href={finalHref}
      className={cn(
        "flex items-center gap-4 transition-all duration-200 group relative rounded-xl",
        !isOpen ? "justify-center px-0" : "px-4",
        isActive
          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
          : "text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400",
        subItem ? "py-2 pl-6" : "py-3"
      )}
    >
      <Icon
        className={cn(
          "shrink-0 transition-transform duration-300",
          subItem ? "h-4 w-4" : "h-5 w-5",
          isOpen && "group-hover:scale-110"
        )}
      />
      {isOpen ? (
        <span className="flex-1 flex items-center justify-between truncate tracking-tight">
          <span
            className={cn(
              subItem ? "text-[13px] font-medium" : "text-[15px] font-bold",
              isActive && "font-black"
            )}
          >
            {label}
          </span>
          {badgeCount !== undefined && badgeCount > 0 && (
            <span className="bg-rose-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-sm shadow-rose-500/30">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
        </span>
      ) : (
        badgeCount !== undefined && badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm shadow-rose-500/30">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )
      )}
    </Link>
  );
}