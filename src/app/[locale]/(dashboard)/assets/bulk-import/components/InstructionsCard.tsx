// src/app/[locale]/(dashboard)/assets/bulk-import/components/InstructionsCard.tsx
"use client";

import { HelpCircle, Info } from "lucide-react";

interface InstructionsCardProps {
  isRtl: boolean;
}

export function InstructionsCard({ isRtl }: InstructionsCardProps) {
  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm sticky top-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
          <HelpCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isRtl ? "تعليمات" : "Instructions"}
        </h3>
      </div>

      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex items-start gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold shrink-0 mt-0.5">
            1
          </span>
          <span>
            {isRtl
              ? "اختر الموقع (مبنى، دور، غرفة) حيث ستُضاف الأصول."
              : "Select the location (building, floor, room) where assets will be added."}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold shrink-0 mt-0.5">
            2
          </span>
          <span>
            {isRtl
              ? "أضف صفوفاً جديدة يدوياً أو استورد ملف CSV."
              : "Add rows manually or import a CSV file."}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold shrink-0 mt-0.5">
            3
          </span>
          <span>
            {isRtl
              ? "تأكد من ملء الحقول الإلزامية (الاسم والنوع) لكل صف."
              : "Make sure required fields (name and type) are filled for each row."}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold shrink-0 mt-0.5">
            4
          </span>
          <span>
            {isRtl
              ? "بعد الانتهاء، اضغط 'حفظ جميع الأصول' لإضافتها دفعة واحدة."
              : "When done, click 'Save All Assets' to add them at once."}
          </span>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/30 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {isRtl
            ? "يمكنك استيراد ملف CSV يحتوي على أعمدة: name, nameEn, description, type, status, purchaseDate, operationDate, warrantyEnd, lastMaintenanceDate, serialNumber, manufacturer, model, supplier, notes. استخدم زر تحميل القالب للحصول على نموذج."
            : "You can import a CSV file with columns: name, nameEn, description, type, status, purchaseDate, operationDate, warrantyEnd, lastMaintenanceDate, serialNumber, manufacturer, model, supplier, notes. Use the Download Template button to get a sample."}
        </p>
      </div>
    </div>
  );
}