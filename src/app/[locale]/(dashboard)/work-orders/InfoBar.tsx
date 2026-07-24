// src/app/[locale]/(dashboard)/work-orders/shared/InfoBar.tsx
"use client";

import { Hash, Calendar, User, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

interface InfoBarProps {
  code?: string;
  createdAt?: string | null;
  createdBy?: string | null;
  isRtl: boolean;
  className?: string;
  source?: { label: string; icon: string };
  status?: { name: string; color?: string };
  priority?: { name: string; color?: string };
  onQuickUpdate?: () => void;
}

const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

export function InfoBar({
  code,
  createdAt,
  createdBy,
  isRtl,
  className = "",
  source,
  status,
  priority,
  onQuickUpdate,
}: InfoBarProps) {
  let formattedDate = "—";
  if (createdAt && isValidDate(createdAt)) {
    const dateObj = new Date(createdAt);
    const localeObj = isRtl ? arSA : enUS;
    formattedDate = format(dateObj, "dd/MM/yyyy, hh:mm a", { locale: localeObj });
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-4 p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {/* الكود */}
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {isRtl ? "رقم الأمر" : "Order #"}
          </span>
          <Badge
            variant="outline"
            className="font-mono text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 bg-transparent"
          >
            {code || (isRtl ? "سيتم إنشاؤه تلقائياً" : "Auto-generated")}
          </Badge>
        </div>

        {/* المصدر */}
        {source && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {isRtl ? "المصدر" : "Source"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-indigo-500 dark:text-indigo-400">{source.icon}</span>
              {source.label}
            </span>
          </div>
        )}

        {/* الحالة مع زر التحديث السريع */}
        {status && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {isRtl ? "الحالة" : "Status"}
            </span>
            <span
              className="text-sm font-bold px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60"
              style={{
                backgroundColor: `${status.color || "#6b7280"}25`,
                color: status.color || "#6b7280",
              }}
            >
              {status.name}
            </span>
            {onQuickUpdate && (
              <button
                onClick={onQuickUpdate}
                className="p-1 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                title={isRtl ? "تحديث سريع" : "Quick Update"}
              >
                <Pencil className="h-3.5 w-3.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
              </button>
            )}
          </div>
        )}

        {/* الأولوية */}
        {priority && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {isRtl ? "الأولوية" : "Priority"}
            </span>
            <span
              className="text-sm font-bold px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60"
              style={{
                backgroundColor: `${priority.color || "#6b7280"}25`,
                color: priority.color || "#6b7280",
              }}
            >
              {priority.name}
            </span>
          </div>
        )}

        {/* التاريخ */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {isRtl ? "التاريخ" : "Date"}
          </span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {formattedDate}
          </span>
        </div>

        {/* المنشئ */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {isRtl ? "المنشئ" : "Creator"}
          </span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {createdBy || "Unknown"}
          </span>
        </div>
      </div>
    </div>
  );
}