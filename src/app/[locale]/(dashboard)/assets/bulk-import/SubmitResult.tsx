// src/app/[locale]/(dashboard)/assets/bulk-import/components/SubmitResult.tsx

"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";

interface ImportError {
  assetName?: string;
  message: string;
}

interface SubmitResultData {
  successCount: number;
  failCount: number;
  errors: ImportError[];
}

interface SubmitResultProps {
  result: SubmitResultData | null;
  isRtl: boolean;
}

export function SubmitResult({ result, isRtl }: SubmitResultProps) {
  if (!result) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200/30 bg-slate-50/50 p-4 dark:border-slate-700/30 dark:bg-slate-800/30">
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

            <ul className="mt-2 list-inside list-disc space-y-1">
              {result.errors.map((err, index) => (
                <li key={index}>
                  {err.assetName ? `[${err.assetName}] ` : ""}
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