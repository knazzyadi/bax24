// src/app/[locale]/(dashboard)/inspections/[id]/InspectionItemsCard.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckCircle, XCircle, MinusCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ResultState,
  FindingDraft,
  InspectionItemWithResult, // ✅ 1. استيراد النوع الجديد
} from "../types";

// ============================================================
// أيقونة النتيجة (Pass / Fail / N/A)
// ============================================================
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
      active:
        "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 ring-2 ring-green-500/60",
      hover:
        "hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-green-600 dark:hover:text-green-400",
      inactive: "text-slate-300 dark:text-slate-600",
    },
    fail: {
      active:
        "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 ring-2 ring-red-500/60",
      hover:
        "hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400",
      inactive: "text-slate-300 dark:text-slate-600",
    },
    na: {
      active:
        "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-2 ring-blue-500/60",
      hover:
        "hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400",
      inactive: "text-slate-300 dark:text-slate-600",
    },
  };

  const Icon =
    type === "pass" ? CheckCircle : type === "fail" ? XCircle : MinusCircle;

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

// ============================================================
// المكون الرئيسي
// ============================================================
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
    items: InspectionItemWithResult[]; // ✅ 2. استبدال any
  }[];
  resultsState: Record<string, ResultState>;
  onUpdateResult: (
    formItemId: string,
    field: keyof ResultState,
    value: ResultState[keyof ResultState] // ✅ 3. استبدال any
  ) => void;
  isRtl: boolean;
}) {
  // ===== حالة تحرير الملاحظة =====
  const [editingFailId, setEditingFailId] = useState<string | null>(null);
  const [draftFinding, setDraftFinding] = useState<FindingDraft>({
    title: "",
    description: "",
    riskLevel: "medium",
    correctiveAction: "",
    dueDate: "",
  });

  // ===== دوال النتائج =====
  const setResult = (formItemId: string, value: "pass" | "fail" | "na") => {
    if (value === "fail") {
      setEditingFailId(formItemId);
      const existing = resultsState[formItemId]?.finding;
      setDraftFinding(
        existing || {
          title: "",
          description: "",
          riskLevel: "medium",
          correctiveAction: "",
          dueDate: "",
        }
      );
    } else {
      setEditingFailId(null);
      onUpdateResult(formItemId, "result", value);
      onUpdateResult(formItemId, "finding", null);
      onUpdateResult(formItemId, "workOrderId", undefined);
    }
  };

  const handleSaveFinding = (itemId: string) => {
    if (!draftFinding.title.trim()) {
      alert(isRtl ? "عنوان الملاحظة مطلوب" : "Finding title is required");
      return;
    }
    onUpdateResult(itemId, "result", "fail");
    onUpdateResult(itemId, "finding", draftFinding);
    setEditingFailId(null);
  };

  const handleCancelFail = (itemId: string) => {
    setEditingFailId(null);
    onUpdateResult(itemId, "result", "na");
    onUpdateResult(itemId, "finding", null);
  };

  // ===== إحصائيات الفئة =====
  const getCategoryStats = (items: InspectionItemWithResult[]) => {
    // ✅ 4. استبدال any
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

  // ===== الترجمة =====
  const labels = {
    pass: isRtl ? "مطابق" : "Pass",
    fail: isRtl ? "غير مطابق" : "Fail",
    na: isRtl ? "لا ينطبق" : "N/A",
  };

  const riskLevelLabels = {
    low: isRtl ? "منخفضة" : "Low",
    medium: isRtl ? "متوسطة" : "Medium",
    high: isRtl ? "عالية" : "High",
    critical: isRtl ? "حرجة" : "Critical",
  };

  // ===== التصيير =====
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
                  <span>
                    {isRtl
                      ? category.categoryNameAr || category.categoryName
                      : category.categoryName}
                  </span>
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
                const finding = resultsState[item.id]?.finding;

                // ===== عرض نموذج الملاحظة (حالة التحرير) =====
                if (editingFailId === item.id) {
                  return (
                    <div
                      key={item.id}
                      className="p-5 border-l-4 border-red-500 bg-red-50/70 dark:bg-red-950/20 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                          <XCircle className="h-5 w-5" />
                          {isRtl ? "غير مطابق" : "Fail"}
                        </h4>
                        <span className="text-sm text-slate-500">
                          {isRtl
                            ? "يرجى إدخال تفاصيل الملاحظة"
                            : "Please enter finding details"}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* العنوان */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {isRtl ? "عنوان الملاحظة *" : "Finding Title *"}
                          </label>
                          <input
                            type="text"
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-400 outline-none"
                            placeholder={
                              isRtl
                                ? "أدخل عنوان الملاحظة"
                                : "Enter finding title"
                            }
                            value={draftFinding.title}
                            onChange={(e) =>
                              setDraftFinding((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>

                        {/* الوصف */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {isRtl ? "تعليمات الفحص" : "Inspection Instructions"}
                          </label>
                          <textarea
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-400 outline-none"
                            rows={2}
                            placeholder={
                              isRtl
                                ? "أدخل وصفاً تفصيلياً"
                                : "Enter detailed description"
                            }
                            value={draftFinding.description || ""}
                            onChange={(e) =>
                              setDraftFinding((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>

                        {/* درجة الخطورة - riskLevel */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {isRtl ? "درجة الخطورة" : "Risk Level"}
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {(
                              ["low", "medium", "high", "critical"] as const
                            ).map((level) => (
                              <label
                                key={level}
                                className="flex items-center gap-1 text-sm cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`riskLevel-${item.id}`}
                                  checked={draftFinding.riskLevel === level}
                                  onChange={() =>
                                    setDraftFinding((prev) => ({
                                      ...prev,
                                      riskLevel: level,
                                    }))
                                  }
                                  className="accent-red-600"
                                />
                                {riskLevelLabels[level]}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* الإجراء التصحيحي */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {isRtl ? "الإجراء التصحيحي" : "Corrective Action"}
                          </label>
                          <input
                            type="text"
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-400 outline-none"
                            placeholder={
                              isRtl
                                ? "أدخل الإجراء المقترح"
                                : "Enter proposed corrective action"
                            }
                            value={draftFinding.correctiveAction || ""}
                            onChange={(e) =>
                              setDraftFinding((prev) => ({
                                ...prev,
                                correctiveAction: e.target.value,
                              }))
                            }
                          />
                        </div>

                        {/* تاريخ الاستحقاق */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {isRtl ? "تاريخ الاستحقاق" : "Due Date"}
                          </label>
                          <input
                            type="date"
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-400 outline-none"
                            value={draftFinding.dueDate || ""}
                            onChange={(e) =>
                              setDraftFinding((prev) => ({
                                ...prev,
                                dueDate: e.target.value,
                              }))
                            }
                          />
                        </div>

                        {/* أزرار التحكم */}
                        <div className="flex gap-3 pt-2">
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                            onClick={() => handleSaveFinding(item.id)}
                          >
                            {isRtl ? "حفظ الملاحظة" : "Save Finding"}
                          </button>
                          <button
                            className="border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                            onClick={() => handleCancelFail(item.id)}
                          >
                            {isRtl ? "إلغاء" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // ===== عرض عادي (غير محرر) =====
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
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-[120px]">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 item-name">
                          {isRtl ? item.nameAr || item.name : item.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-medium",
                            item.riskLevel === "critical" &&
                              "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400",
                            item.riskLevel === "high" &&
                              "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400",
                            item.riskLevel === "medium" &&
                              "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400",
                            item.riskLevel === "low" &&
                              "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                          )}
                        >
                          {riskLevelLabels[item.riskLevel as keyof typeof riskLevelLabels]}
                        </Badge>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "eye-icon p-1 rounded-full transition-colors",
                                (notes || finding)
                                  ? "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20"
                                  : "text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
                              )}
                              aria-label="عرض التفاصيل"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-4 text-sm bg-white dark:bg-slate-900 border shadow-lg rounded-xl space-y-3 max-h-[400px] overflow-y-auto">
                            {/* وصف العنصر */}
                            {item.description && (
                              <>
                                <h4 className="font-semibold text-slate-700 dark:text-slate-300">
                                  {isRtl ? "تعليمات الفحص" : "Inspection Instructions"}
                                </h4>
                                <p className="text-slate-600 dark:text-slate-400 mb-1">
                                  {isRtl
                                    ? item.descriptionAr || item.description
                                    : item.description}
                                </p>
                              </>
                            )}

                            {/* ملاحظات النتيجة (notes) */}
                            {notes && (
                              <>
                                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mt-2">
                                  {isRtl ? "ملاحظات" : "Notes"}
                                </h4>
                                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                  {notes}
                                </p>
                              </>
                            )}

                            {/* ===== عرض معلومات الـ Finding المحفوظ ===== */}
                            {finding && (
                              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-2 space-y-2">
                                <h4 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                                  {isRtl ? "تفاصيل الملاحظة" : "Finding Details"}
                                </h4>

                                <div>
                                  <span className="font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                    {isRtl ? "العنوان" : "Title"}
                                  </span>
                                  <p className="text-slate-800 dark:text-slate-200">
                                    {finding.title}
                                  </p>
                                </div>

                                {finding.description && (
                                  <div>
                                    <span className="font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                      {isRtl ? "الوصف" : "Description"}
                                    </span>
                                    <p className="text-slate-700 dark:text-slate-300">
                                      {finding.description}
                                    </p>
                                  </div>
                                )}

                                <div>
                                  <span className="font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                    {isRtl ? "مستوى الخطورة" : "Risk Level"}
                                  </span>
                                  <p className="text-slate-800 dark:text-slate-200">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs font-normal",
                                        finding.riskLevel === "critical" &&
                                          "border-red-500 text-red-700 dark:text-red-400",
                                        finding.riskLevel === "high" &&
                                          "border-orange-500 text-orange-700 dark:text-orange-400",
                                        finding.riskLevel === "medium" &&
                                          "border-yellow-500 text-yellow-700 dark:text-yellow-400",
                                        finding.riskLevel === "low" &&
                                          "border-green-500 text-green-700 dark:text-green-400"
                                      )}
                                    >
                                      {riskLevelLabels[finding.riskLevel]}
                                    </Badge>
                                  </p>
                                </div>

                                {finding.correctiveAction && (
                                  <div>
                                    <span className="font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                      {isRtl ? "الإجراء التصحيحي" : "Corrective Action"}
                                    </span>
                                    <p className="text-slate-700 dark:text-slate-300">
                                      {finding.correctiveAction}
                                    </p>
                                  </div>
                                )}

                                {finding.dueDate && (
                                  <div>
                                    <span className="font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                      {isRtl ? "تاريخ الاستحقاق" : "Due Date"}
                                    </span>
                                    <p className="text-slate-800 dark:text-slate-200">
                                      {new Date(finding.dueDate).toLocaleDateString(
                                        isRtl ? "ar" : "en",
                                        {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        }
                                      )}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div
                        className="flex items-center gap-1 result-icon-group"
                        dir="ltr"
                      >
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

                    <div className="item-details hidden print:block text-xs text-slate-600 mt-1">
                      {item.description && (
                        <p>
                          <strong>
                            {isRtl ? "تعليمات الفحص:" : "Inspection Instructions:"}
                          </strong>{" "}
                          {item.description}
                        </p>
                      )}
                      {notes && (
                        <p>
                          <strong>{isRtl ? "ملاحظة:" : "Note:"}</strong> {notes}
                        </p>
                      )}
                      {finding && (
                        <>
                          <p>
                            <strong>{isRtl ? "عنوان الملاحظة:" : "Finding Title:"}</strong> {finding.title}
                          </p>
                          {finding.riskLevel && (
                            <p>
                              <strong>{isRtl ? "مستوى الخطورة:" : "Risk Level:"}</strong> {riskLevelLabels[finding.riskLevel]}
                            </p>
                          )}
                          {finding.correctiveAction && (
                            <p>
                              <strong>{isRtl ? "الإجراء التصحيحي:" : "Corrective Action:"}</strong> {finding.correctiveAction}
                            </p>
                          )}
                          {finding.dueDate && (
                            <p>
                              <strong>{isRtl ? "تاريخ الاستحقاق:" : "Due Date:"}</strong> {new Date(finding.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </>
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