// src/app/[locale]/(dashboard)/inspections/[id]/InspectionItemsCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckCircle, XCircle, MinusCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResultState } from "../types";

const ResultIcon = ({
  type,
  isActive,
  onClick,
  label,
}: {
  type: "pass" | "fail" | "na";
  isActive: boolean;
  onClick: () => void;
  label: string;
}) => {
  const colors = {
    pass: {
      active: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 ring-2 ring-green-500/60",
      hover: "hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-green-600 dark:hover:text-green-400",
      inactive: "text-slate-300 dark:text-slate-600",
    },
    fail: {
      active: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 ring-2 ring-red-500/60",
      hover: "hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400",
      inactive: "text-slate-300 dark:text-slate-600",
    },
    na: {
      active: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-2 ring-blue-500/60",
      hover: "hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400",
      inactive: "text-slate-300 dark:text-slate-600",
    },
  };

  const Icon = type === "pass" ? CheckCircle : type === "fail" ? XCircle : MinusCircle;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400",
        isActive ? colors[type].active : colors[type].inactive,
        !isActive && colors[type].hover
      )}
    >
      <Icon
        className={cn(
          "h-6 w-6 transition-all duration-300",
          isActive ? "drop-shadow-md" : "drop-shadow-none"
        )}
        strokeWidth={isActive ? 2.5 : 1.5}
      />
      <span className="text-[10px] font-medium opacity-70 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    </button>
  );
};

export function InspectionItemsCard({
  categories,
  resultsState,
  onUpdateResult,
  isRtl,
}: {
  categories: {
    categoryId: string;
    categoryName: string;
    categoryNameAr?: string;
    items: any[];
  }[];
  resultsState: Record<string, ResultState>;
  onUpdateResult: (formItemId: string, field: keyof ResultState, value: any) => void;
  isRtl: boolean;
}) {
  const setResult = (formItemId: string, value: "pass" | "fail" | "na") => {
    onUpdateResult(formItemId, "result", value);
    if (value !== "fail") {
      onUpdateResult(formItemId, "workOrderId", undefined);
    }
  };

  const getCategoryStats = (items: any[]) => {
    let pass = 0,
      fail = 0,
      na = 0;
    items.forEach((item) => {
      const result = resultsState[item.id]?.result;
      if (result === "pass") pass++;
      else if (result === "fail") fail++;
      else if (result === "na") na++;
    });
    return { pass, fail, na, total: items.length };
  };

  const labels = {
    pass: isRtl ? "مطابق" : "Pass",
    fail: isRtl ? "غير مطابق" : "Fail",
    na: isRtl ? "لا ينطبق" : "N/A",
  };

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const stats = getCategoryStats(category.items);
        const totalItems = category.items.length;
        const completed = stats.pass + stats.fail + stats.na;

        return (
          <Card
            key={category.categoryId}
            className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-200"
          >
            <CardHeader className="border-b bg-muted/30 px-5 py-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>{isRtl ? category.categoryNameAr || category.categoryName : category.categoryName}</span>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {completed}/{totalItems}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2 text-xs">
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
                    ✔ {stats.pass}
                  </Badge>
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">
                    ✖ {stats.fail}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400">
                    ○ {stats.na}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
              {category.items.map((item) => {
                const currentResult = resultsState[item.id]?.result || "na";
                const isPass = currentResult === "pass";
                const isFail = currentResult === "fail";
                const isNa = currentResult === "na";
                const notes = resultsState[item.id]?.notes || "";

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex flex-col gap-1 py-4 px-5 transition-colors",
                      isPass && "bg-green-50/50 dark:bg-green-950/10",
                      isFail && "bg-red-50/50 dark:bg-red-950/10",
                      isNa && "bg-slate-50/50 dark:bg-slate-800/30"
                    )}
                  >
                    {/* الصف الرئيسي */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-[120px]">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 item-name">
                          {isRtl ? item.nameAr || item.name : item.name}
                        </p>

                        {/* أيقونة العين */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "eye-icon p-1 rounded-full transition-colors",
                                notes
                                  ? "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20"
                                  : "text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
                              )}
                              aria-label="عرض التفاصيل"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-4 text-sm bg-white dark:bg-slate-900 border shadow-lg rounded-xl">
                            {item.description && (
                              <>
                                <h4 className="font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                  {isRtl ? "الوصف" : "Description"}
                                </h4>
                                <p className="text-slate-600 dark:text-slate-400 mb-3">
                                  {isRtl ? item.descriptionAr || item.description : item.description}
                                </p>
                              </>
                            )}
                            {notes && (
                              <>
                                <h4 className="font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                  {isRtl ? "الملاحظات" : "Notes"}
                                </h4>
                                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                  {notes}
                                </p>
                              </>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* الأيقونات الثلاث */}
                      <div className="flex items-center gap-1 result-icon-group" dir="ltr">
                        <ResultIcon
                          type="pass"
                          isActive={isPass}
                          onClick={() => setResult(item.id, "pass")}
                          label={labels.pass}
                        />
                        <ResultIcon
                          type="fail"
                          isActive={isFail}
                          onClick={() => setResult(item.id, "fail")}
                          label={labels.fail}
                        />
                        <ResultIcon
                          type="na"
                          isActive={isNa}
                          onClick={() => setResult(item.id, "na")}
                          label={labels.na}
                        />
                      </div>
                    </div>

                    {/* تفاصيل للطباعة */}
                    <div className="item-details hidden print:block text-xs text-slate-600 mt-1">
                      {item.description && (
                        <p>
                          <strong>{isRtl ? "الوصف:" : "Description:"}</strong>{" "}
                          {isRtl ? item.descriptionAr || item.description : item.description}
                        </p>
                      )}
                      {notes && (
                        <p>
                          <strong>{isRtl ? "ملاحظة:" : "Note:"}</strong> {notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}