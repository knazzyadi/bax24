// src/app/[locale]/(dashboard)/work-orders/[id]/AssetsCard.tsx
"use client";

import { useState } from "react";
import { Package, CheckCircle2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface WorkOrderAsset {
  assetId: string;
  completedAt: string | null;
  notes: string | null;
  asset: {
    id: string;
    name: string;
    nameEn?: string;
    code: string;
  };
}

interface AssetsCardProps {
  workOrderAssets: WorkOrderAsset[];
  pendingCount: number;
  hasAssets: boolean;
  onCompleteAsset: (asset: WorkOrderAsset) => void;
  onCompleteAll: () => void;
  isRtl: boolean;
  t: (key: string, options?: any) => string;
  actionLoading: boolean;
  locale: string;
}

export function AssetsCard({
  workOrderAssets,
  pendingCount,
  hasAssets,
  onCompleteAsset,
  onCompleteAll,
  isRtl,
  t,
  actionLoading,
  locale,
}: AssetsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // ✅ تم تعديل الدالة لاستقبال string | null
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const localeObj = locale === "ar" ? arSA : enUS;
    return format(date, "PPP", { locale: localeObj });
  };

  const textAlign = isRtl ? "text-right" : "text-left";

  // ✅ عرض مبسط للأصول (قائمة مختصرة)
  const renderSimpleList = () => (
    <div className="flex flex-wrap gap-2 mt-2">
      {workOrderAssets.map((woa) => {
        const asset = woa.asset;
        const isCompleted = !!woa.completedAt;
        return (
          <span
            key={woa.assetId}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border",
              isCompleted
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
                : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-amber-500" />
            )}
            {isRtl ? asset.name : asset.nameEn || asset.name}
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
          <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("assets")}
        </h2>
        <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
          {workOrderAssets.length}
        </span>
        {pendingCount > 0 && (
          <span className="text-xs text-amber-500 dark:text-amber-400 font-medium">
            ({t("pendingCount", { count: pendingCount })})
          </span>
        )}
      </div>

      {hasAssets ? (
        <>
          {/* ✅ عرض القائمة المبسطة دائماً */}
          {renderSimpleList()}

          {/* ✅ زر عرض التفاصيل / إخفائها */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  {isRtl ? "إخفاء التفاصيل" : "Hide details"}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  {isRtl ? "عرض التفاصيل" : "Show details"}
                </>
              )}
            </Button>

            {pendingCount > 0 && (
              <Button
                onClick={onCompleteAll}
                size="sm"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
                disabled={actionLoading}
              >
                <Check className="h-4 w-4 mr-1.5" />
                {t("completeAll")}
              </Button>
            )}
          </div>

          {/* ✅ الجدول التفصيلي (يظهر عند التوسيع) */}
          {isExpanded && (
            <div className="mt-4 border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead className={cn("text-slate-600 dark:text-slate-300 font-semibold", textAlign)}>
                      {t("assetName")}
                    </TableHead>
                    <TableHead className={cn("text-slate-600 dark:text-slate-300 font-semibold", textAlign)}>
                      {t("assetCode")}
                    </TableHead>
                    <TableHead className={cn("text-slate-600 dark:text-slate-300 font-semibold", textAlign)}>
                      {t("completionStatus")}
                    </TableHead>
                    <TableHead className={cn("text-slate-600 dark:text-slate-300 font-semibold", textAlign)}>
                      {isRtl ? "ملاحظات الإنجاز" : "Completion Notes"}
                    </TableHead>
                    <TableHead className={cn("text-slate-600 dark:text-slate-300 font-semibold", textAlign)}>
                      {t("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrderAssets.map((woa) => {
                    const asset = woa.asset;
                    const isCompleted = !!woa.completedAt;
                    return (
                      <TableRow
                        key={woa.assetId}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        <TableCell className={cn("font-medium text-slate-800 dark:text-slate-100", textAlign)}>
                          {isRtl ? asset.name : asset.nameEn || asset.name}
                        </TableCell>
                        <TableCell className={cn("font-mono text-xs text-slate-500 dark:text-slate-400", textAlign)}>
                          {asset.code}
                        </TableCell>
                        <TableCell className={textAlign}>
                          {isCompleted ? (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 justify-end">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-sm font-medium">{formatDate(woa.completedAt)}</span>
                            </div>
                          ) : (
                            <span className="text-amber-500 dark:text-amber-400 font-medium">
                              {t("pending")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className={textAlign}>
                          {isCompleted && woa.notes ? (
                            <span className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                              {woa.notes}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </TableCell>
                        <TableCell className={textAlign}>
                          {!isCompleted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onCompleteAsset(woa)}
                              disabled={actionLoading}
                              className="rounded-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      ) : (
        <p className="text-slate-400 dark:text-slate-500 text-center py-6">{t("noAssets")}</p>
      )}
    </div>
  );
}