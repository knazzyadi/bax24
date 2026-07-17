// work-orders/shared/GuidelinesCard.tsx
"use client";

import { Sparkles, Shield } from "lucide-react";

export function GuidelinesCard({ isRtl }: { isRtl: boolean }) {
  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/40 dark:to-purple-950/40">
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isRtl ? "إرشادات" : "Guidelines"}
        </h3>
      </div>
      <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
        <li className="flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            {isRtl
              ? "اختر مستوى الموقع (مبنى/دور/غرفة) لتحديد الأصول المتاحة."
              : "Choose location level (building/floor/room) to filter available assets."}
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            {isRtl
              ? "يمكنك اختيار عدة أصول لأمر العمل الواحد."
              : "You can select multiple assets for a single work order."}
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <span>
            {isRtl
              ? "الحقول المميزة بـ * إلزامية."
              : "Fields marked with * are required."}
          </span>
        </li>
      </ul>
    </div>
  );
}