// src/app/[locale]/(dashboard)/assets/bulk-import/components/SubmitResult.tsx
"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";

interface SubmitResultProps {
  result: {
    successCount: number;
    failCount: number;
    errors: any[];
  } | null;
  isRtl: boolean;
}

export function SubmitResult({ result, isRtl }: SubmitResultProps) {
  if (!result) return null;

  return (
    <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {isRtl ? "نجح:" : "Success:"} {result.successCount}
          </span>
        </div>
        {result.failCount > 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-500" />
            <span className="font-medium text-rose-600 dark:text-rose-400">
              {isRtl ? "فشل:" : "Failed:"} {result.failCount}
            </span>
          </div>
        )}
        {result.errors.length > 0 && (
          <details className="text-xs text-slate-500 dark:text-slate-400">
            <summary className="cursor-pointer">
              {isRtl ? "عرض الأخطاء" : "Show errors"}
            </summary>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {result.errors.map((err, i) => (
                <li key={i}>
                  {err.assetName && `[${err.assetName}] `}
                  {err.message}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}