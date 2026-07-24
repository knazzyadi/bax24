// src/app/[locale]/(dashboard)/work-orders/GuidelinesCard.tsx
"use client";

import { Sparkles, Shield, AlertCircle } from "lucide-react";

export function GuidelinesCard({ isRtl }: { isRtl: boolean }) {
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
          <Sparkles className="h-5 w-5 text-indigo-700 dark:text-indigo-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isRtl ? "إرشادات" : "Guidelines"}
        </h3>
      </div>
      <ul className="space-y-3 text-sm">
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 shrink-0 mt-0.5">
            <Shield className="h-3 w-3 text-emerald-700 dark:text-emerald-300" />
          </span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {isRtl
              ? "اختر مستوى الموقع (مبنى/دور/غرفة) لتحديد الأصول المتاحة."
              : "Choose location level (building/floor/room) to filter available assets."}
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 shrink-0 mt-0.5">
            <Shield className="h-3 w-3 text-emerald-700 dark:text-emerald-300" />
          </span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {isRtl
              ? "يمكنك اختيار عدة أصول لأمر العمل الواحد."
              : "You can select multiple assets for a single work order."}
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/40 shrink-0 mt-0.5">
            <AlertCircle className="h-3 w-3 text-rose-700 dark:text-rose-300" />
          </span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {isRtl
              ? "الحقول المميزة بـ * إلزامية."
              : "Fields marked with * are required."}
          </span>
        </li>
      </ul>
    </div>
  );
}