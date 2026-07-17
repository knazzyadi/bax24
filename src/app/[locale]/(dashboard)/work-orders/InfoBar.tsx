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
  onQuickUpdate?: () => void; // ✅ إضافة
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
  onQuickUpdate, // ✅ استقبال
}: InfoBarProps) {
  let formattedDate = "—";
  if (createdAt && isValidDate(createdAt)) {
    const dateObj = new Date(createdAt);
    const localeObj = isRtl ? arSA : enUS;
    formattedDate = format(dateObj, "dd/MM/yyyy, hh:mm a", { locale: localeObj });
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-800/30 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {isRtl ? "رقم الأمر" : "Order #"}
          </span>
          <Badge variant="outline" className="font-mono">
            {code || (isRtl ? "سيتم إنشاؤه تلقائياً" : "Auto-generated")}
          </Badge>
        </div>

        {source && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {isRtl ? "المصدر" : "Source"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 px-3 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
              <span>{source.icon}</span>
              {source.label}
            </span>
          </div>
        )}

        {/* ✅ الحالة مع زر التحديث السريع */}
        {status && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {isRtl ? "الحالة" : "Status"}
            </span>
            <span
              className="text-sm font-semibold px-3 py-0.5 rounded-full"
              style={{
                backgroundColor: `${status.color || "#6b7280"}20`,
                color: status.color || "#6b7280",
              }}
            >
              {status.name}
            </span>
            {onQuickUpdate && (
              <button
                onClick={onQuickUpdate}
                className="p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                title={isRtl ? "تحديث سريع" : "Quick Update"}
              >
                <Pencil className="h-3.5 w-3.5 text-slate-400 hover:text-indigo-600" />
              </button>
            )}
          </div>
        )}

        {priority && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {isRtl ? "الأولوية" : "Priority"}
            </span>
            <span
              className="text-sm font-semibold px-3 py-0.5 rounded-full"
              style={{
                backgroundColor: `${priority.color || "#6b7280"}20`,
                color: priority.color || "#6b7280",
              }}
            >
              {priority.name}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {isRtl ? "التاريخ" : "Date"}
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {formattedDate}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {isRtl ? "المنشئ" : "Creator"}
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {createdBy || "Unknown"}
          </span>
        </div>
      </div>
    </div>
  );
}