// src/app/[locale]/(dashboard)/work-orders/[id]/Sidebar.tsx
"use client";

import { Calendar, Building } from "lucide-react";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

interface SidebarProps {
  createdAt: string;
  updatedAt: string;
  branch: {
    name: string;
    nameEn?: string | null;
  } | null;
  isRtl: boolean;
  t: (key: string) => string;
  locale: string;
}

export function Sidebar({
  createdAt,
  updatedAt,
  branch,
  isRtl,
  t,
  locale,
}: SidebarProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";

    const date = new Date(dateStr);
    const localeObj = locale === "ar" ? arSA : enUS;

    return format(date, "PPP", { locale: localeObj });
  };

  return (
    <div className="space-y-6">
      {/* التواريخ */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>

          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t("dates")}
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {t("createdAt")}
            </div>

            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {formatDate(createdAt)}
            </p>
          </div>

          <div>
            <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {t("updatedAt")}
            </div>

            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {formatDate(updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* الفرع */}
      {branch && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdropblur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
              <Building className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>

            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {t("branch")}
            </h3>
          </div>

          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {isRtl ? branch.name : branch.nameEn || branch.name}
          </p>
        </div>
      )}

      {/* مساعدة سريعة */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
        <span className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5">
          🛡️
        </span>

        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
          {isRtl
            ? "يمكنك إكمال الأصول الفردية أو جميعها دفعة واحدة مع إضافة ملاحظات."
            : "You can complete individual assets or all at once with notes."}
        </div>
      </div>
    </div>
  );
}