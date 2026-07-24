// src/app/[locale]/(dashboard)/inspections/[id]/InspectionItemsCard.tsx
"use client";

import { ClipboardCheck, CheckCircle2, XCircle, MinusCircle, Wrench, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NonComplianceWorkOrderDialog } from "./NonComplianceWorkOrderDialog";

// ============================================================
// الأنواع
// ============================================================
interface ResultState {
  id: string;
  itemId: string;
  result: "pass" | "fail" | "na";
  notes?: string;
  imageUrl?: string;
  workOrderId?: string;
}

interface CategoryItem {
  id: string;
  name: string;
  nameAr?: string;
  riskLevel: string;
  description?: string;
  result: ResultState | null;
}

interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  categoryNameAr?: string;
  items: CategoryItem[];
}

interface InspectionItemsCardProps {
  categories: CategoryGroup[];
  resultsState: Record<string, ResultState>;
  onUpdateResult: (itemId: string, field: keyof ResultState, value: any) => void;
  isRtl: boolean;
  t: any;
  locale: string;
}

// ============================================================
// المكون الرئيسي
// ============================================================
export function InspectionItemsCard({
  categories,
  resultsState,
  onUpdateResult,
  isRtl,
  t,
  locale,
}: InspectionItemsCardProps) {
  const [woDialogOpen, setWoDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // حساب الإحصائيات الكلية
  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const completedItems = Object.values(resultsState).filter(r => r.result !== "na").length;
  const pendingCount = totalItems - completedItems;

  const hasItems = totalItems > 0;

  // فتح حوار إنشاء أمر العمل
  const openWoDialog = (itemId: string) => {
    const result = resultsState[itemId];
    if (result?.result !== "fail") {
      toast.warning(isRtl ? "يمكن تحويل البنود غير المطابقة فقط" : "Only failed items can be converted");
      return;
    }
    setSelectedItemId(itemId);
    setWoDialogOpen(true);
  };

  // دالة عرض حالة البند
  const getStatusBadge = (result: string | undefined) => {
    if (result === "pass") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-none">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {isRtl ? "مطابق" : "Pass"}
        </Badge>
      );
    }
    if (result === "fail") {
      return (
        <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-none">
          <XCircle className="h-3 w-3 mr-1" />
          {isRtl ? "غير مطابق" : "Fail"}
        </Badge>
      );
    }
    if (result === "na") {
      return (
        <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400">
          <MinusCircle className="h-3 w-3 mr-1" />
          N/A
        </Badge>
      );
    }
    return null;
  };

  return (
    <>
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
        {/* رأس البطاقة الرئيسية */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
            <ClipboardCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t("inspectionItems")}
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
            {totalItems}
          </span>
          {pendingCount > 0 && (
            <span className="text-xs text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 rounded-full">
              {t("pendingCount", { count: pendingCount })}
            </span>
          )}
        </div>

        {hasItems ? (
          <div className="space-y-6">
            {categories.map((category) => {
              const categoryItems = category.items;
              const categoryCompleted = categoryItems.filter(
                (item) => resultsState[item.id]?.result !== "na"
              ).length;
              const categoryPending = categoryItems.length - categoryCompleted;

              return (
                <Card
                  key={category.categoryId}
                  className="border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden bg-white/70 dark:bg-slate-900/70"
                >
                  {/* ✅ عنوان الفئة - بدون خلفية، خط أكبر وبارز */}
                  <CardHeader className="border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span>{isRtl ? category.categoryNameAr || category.categoryName : category.categoryName}</span>
                      <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                        ({categoryItems.length} {isRtl ? "بند" : "items"})
                      </span>
                      {categoryPending > 0 && (
                        <span className="text-xs font-normal text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 rounded-full">
                          {categoryPending} {isRtl ? "معلق" : "pending"}
                        </span>
                      )}
                      {categoryCompleted > 0 && (
                        <span className="text-xs font-normal text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-full">
                          {categoryCompleted} {isRtl ? "مكتمل" : "done"}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    {categoryItems.map((item) => {
                      const result = resultsState[item.id];
                      const isFail = result?.result === "fail";
                      const hasWO = !!result?.workOrderId;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "p-3 rounded-2xl border transition-all duration-200 flex flex-wrap items-center gap-3",
                            isFail
                              ? "border-rose-200 bg-rose-50/30 dark:border-rose-800/50 dark:bg-rose-950/20"
                              : result?.result === "pass"
                              ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800/50 dark:bg-emerald-950/20"
                              : "border-slate-200/60 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/30"
                          )}
                        >
                          {/* اسم البند مع أيقونة العين للوصف */}
                          <div className="flex items-center gap-2 min-w-[120px] flex-1">
                            <span className="font-medium text-sm text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {isRtl ? item.nameAr || item.name : item.name}
                            </span>
                            {item.description && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-72 max-w-sm rounded-xl bg-white/95 dark:bg-slate-900/95 border-slate-200/50 dark:border-slate-800/50 shadow-lg"
                                  align={isRtl ? "end" : "start"}
                                >
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-slate-800 dark:text-slate-100">
                                      {isRtl ? "الوصف" : "Description"}
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                      {item.description}
                                    </p>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                            {isFail && (
                              <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-none text-xs">
                                {isRtl ? "غير مطابق" : "FAIL"}
                              </Badge>
                            )}
                            {hasWO && (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-none text-xs">
                                <Wrench className="h-3 w-3 mr-1" />
                                WO #{result?.workOrderId?.slice(0, 6)}
                              </Badge>
                            )}
                          </div>

                          {/* حقل الملاحظات الصغير */}
                          <div className="flex-1 min-w-[100px] max-w-[200px]">
                            <Input
                              placeholder={isRtl ? "ملاحظة..." : "Note..."}
                              value={result?.notes || ""}
                              onChange={(e) =>
                                onUpdateResult(item.id, "notes", e.target.value)
                              }
                              className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/50 px-2"
                            />
                          </div>

                          {/* أزرار التقييم */}
                          <div className="flex items-center gap-1" dir="ltr">
                            <Button
                              size="sm"
                              variant={result?.result === "pass" ? "default" : "outline"}
                              className={cn(
                                "rounded-xl px-2.5 h-7 text-xs",
                                result?.result === "pass"
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "border-slate-300"
                              )}
                              onClick={() => onUpdateResult(item.id, "result", "pass")}
                            >
                              <CheckCircle2 className="h-3 w-3 ml-1" />{" "}
                              {isRtl ? "مطابق" : "Pass"}
                            </Button>
                            <Button
                              size="sm"
                              variant={result?.result === "fail" ? "default" : "outline"}
                              className={cn(
                                "rounded-xl px-2.5 h-7 text-xs",
                                result?.result === "fail"
                                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                                  : "border-slate-300"
                              )}
                              onClick={() => onUpdateResult(item.id, "result", "fail")}
                            >
                              <XCircle className="h-3 w-3 ml-1" />{" "}
                              {isRtl ? "غير مطابق" : "Fail"}
                            </Button>
                            <Button
                              size="sm"
                              variant={result?.result === "na" ? "default" : "outline"}
                              className={cn(
                                "rounded-xl px-2.5 h-7 text-xs",
                                result?.result === "na"
                                  ? "bg-slate-600 hover:bg-slate-700 text-white"
                                  : "border-slate-300"
                              )}
                              onClick={() => onUpdateResult(item.id, "result", "na")}
                            >
                              <MinusCircle className="h-3 w-3 ml-1" /> N/A
                            </Button>
                          </div>

                          {/* زر تحويل لأمر عمل (للحالات غير المطابقة فقط) */}
                          {isFail && (
                            <Button
                              variant={hasWO ? "default" : "destructive"}
                              size="sm"
                              className={cn(
                                "rounded-xl h-7 text-xs px-3",
                                hasWO ? "bg-amber-600 hover:bg-amber-700" : ""
                              )}
                              disabled={hasWO}
                              onClick={() => openWoDialog(item.id)}
                            >
                              <Wrench className="h-3 w-3 ml-1" />
                              {hasWO
                                ? isRtl
                                  ? "تم التحويل"
                                  : "Converted"
                                : isRtl
                                ? "تحويل"
                                : "To WO"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400 dark:text-slate-500 text-center py-6">
            {t("noItems")}
          </p>
        )}
      </div>

      {/* حوار إنشاء أمر العمل */}
      {selectedItemId && (
        <NonComplianceWorkOrderDialog
          open={woDialogOpen}
          onOpenChange={setWoDialogOpen}
          itemName={(() => {
            let name = "";
            for (const cat of categories) {
              const found = cat.items.find((i) => i.id === selectedItemId);
              if (found) {
                name = found.name || "";
                break;
              }
            }
            return name;
          })()}
          itemNameAr={(() => {
            let nameAr = "";
            for (const cat of categories) {
              const found = cat.items.find((i) => i.id === selectedItemId);
              if (found) {
                nameAr = found.nameAr || "";
                break;
              }
            }
            return nameAr;
          })()}
          currentLocation={{
            buildingId: undefined,
            floorId: undefined,
            roomId: undefined,
          }}
          locale={locale}
          onSuccess={() => {
            toast.success(isRtl ? "تم إنشاء أمر العمل بنجاح" : "Work order created successfully");
          }}
        />
      )}
    </>
  );
}