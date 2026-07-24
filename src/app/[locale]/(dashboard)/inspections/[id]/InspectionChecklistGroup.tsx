// src/app/[locale]/(dashboard)/inspections/[id]/InspectionChecklistGroup.tsx
"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  Camera,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { NonComplianceWorkOrderDialog } from "./NonComplianceWorkOrderDialog";

interface InspectionChecklistGroupProps {
  inspection: any;
  onUpdateResult: (itemId: string, field: string, value: any) => void;
  onSave: () => void;
}

export function InspectionChecklistGroup({
  inspection,
  onUpdateResult,
  onSave,
}: InspectionChecklistGroupProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [woDialogOpen, setWoDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // تجميع النتائج في Map للوصول السريع
  const resultsMap = new Map();
  inspection.results?.forEach((r: any) => resultsMap.set(r.itemId, r));

  // بناء هيكل البيانات: كل عنوان رئيسي يحتوي على بنوده مع النتائج
  const groupedData = inspection.selectedCategories?.map((selection: any) => {
    const category = selection.category;
    const itemsWithResults = category.items?.map((item: any) => ({
      ...item,
      result: resultsMap.get(item.id) || null,
    })) || [];
    return {
      categoryId: category.id,
      categoryName: isRtl ? category.nameAr || category.name : category.name,
      items: itemsWithResults,
    };
  }) || [];

  // فتح حوار إنشاء أمر العمل
  const openWoDialog = (itemId: string) => {
    setSelectedItemId(itemId);
    setWoDialogOpen(true);
  };

  // الحصول على اسم البند المحدد
  const getItemName = (itemId: string | null) => {
    if (!itemId) return "";
    for (const group of groupedData) {
      const found = group.items.find((item: any) => item.id === itemId);
      if (found) return found.name || "";
    }
    return "";
  };

  const getItemNameAr = (itemId: string | null) => {
    if (!itemId) return "";
    for (const group of groupedData) {
      const found = group.items.find((item: any) => item.id === itemId);
      if (found) return found.nameAr || "";
    }
    return "";
  };

  return (
    <div className="space-y-6">
      {groupedData.map((group: any) => (
        <Card
          key={group.categoryId}
          className="bg-white/70 dark:bg-slate-900/70 border-slate-200/50 shadow-sm overflow-hidden"
        >
          <CardHeader className="border-b border-slate-100/50 pb-3 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20">
            <CardTitle className="text-lg font-bold text-indigo-700 dark:text-indigo-400">
              {group.categoryName}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {group.items.map((item: any) => {
              const result = item.result;
              const isFail = result?.result === 'fail';
              const hasWO = !!result?.workOrderId;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-200",
                    isFail
                      ? "border-rose-200 bg-rose-50/30 dark:border-rose-800/50 dark:bg-rose-950/20"
                      : result?.result === 'pass'
                      ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800/50 dark:bg-emerald-950/20"
                      : "border-slate-200/60 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/30"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-[150px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {isRtl ? item.nameAr || item.name : item.name}
                        </span>
                        {item.cbahiCode && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.cbahiCode}
                          </Badge>
                        )}
                        {isFail && (
                          <Badge className="bg-rose-100 text-rose-700 border-none">
                            {isRtl ? "غير مطابق" : "FAIL"}
                          </Badge>
                        )}
                        {hasWO && (
                          <Badge className="bg-amber-100 text-amber-700 border-none">
                            <Wrench className="h-3 w-3 mr-1" />
                            WO #{result?.workOrderId?.slice(0,6)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1" dir="ltr">
                      <Button
                        size="sm"
                        variant={result?.result === 'pass' ? "default" : "outline"}
                        className={cn(
                          "rounded-xl px-3 h-8",
                          result?.result === 'pass'
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "border-slate-300"
                        )}
                        onClick={() => onUpdateResult(item.id, 'result', 'pass')}
                      >
                        <CheckCircle className="h-4 w-4 ml-1" />{" "}
                        {isRtl ? "مطابق" : "Pass"}
                      </Button>
                      <Button
                        size="sm"
                        variant={result?.result === 'fail' ? "default" : "outline"}
                        className={cn(
                          "rounded-xl px-3 h-8",
                          result?.result === 'fail'
                            ? "bg-rose-600 hover:bg-rose-700 text-white"
                            : "border-slate-300"
                        )}
                        onClick={() => onUpdateResult(item.id, 'result', 'fail')}
                      >
                        <XCircle className="h-4 w-4 ml-1" />{" "}
                        {isRtl ? "غير مطابق" : "Fail"}
                      </Button>
                      <Button
                        size="sm"
                        variant={result?.result === 'na' ? "default" : "outline"}
                        className={cn(
                          "rounded-xl px-3 h-8",
                          result?.result === 'na'
                            ? "bg-slate-600 hover:bg-slate-700 text-white"
                            : "border-slate-300"
                        )}
                        onClick={() => onUpdateResult(item.id, 'result', 'na')}
                      >
                        <MinusCircle className="h-4 w-4 ml-1" /> N/A
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
                    <div className="md:col-span-3">
                      <Textarea
                        placeholder={isRtl ? "أضف ملاحظة..." : "Add note..."}
                        value={result?.notes || ""}
                        onChange={(e) =>
                          onUpdateResult(item.id, "notes", e.target.value)
                        }
                        className="min-h-[60px] text-sm rounded-xl bg-white/70 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700/50"
                      />
                    </div>
                    <div className="md:col-span-2 flex flex-wrap items-end gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl h-9">
                        <Camera className="h-4 w-4 ml-1" />{" "}
                        {isRtl ? "صورة" : "Photo"}
                      </Button>
                      {result?.result === 'fail' && (
                        <Button
                          variant={hasWO ? "default" : "destructive"}
                          size="sm"
                          className={cn(
                            "rounded-xl h-9",
                            hasWO ? "bg-amber-600 hover:bg-amber-700" : ""
                          )}
                          disabled={hasWO}
                          onClick={() => openWoDialog(item.id)}
                        >
                          <Wrench className="h-4 w-4 ml-1" />
                          {hasWO
                            ? isRtl
                              ? "تم التحويل"
                              : "Converted"
                            : isRtl
                            ? "تحويل لأمر عمل"
                            : "To WO"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* ✅ حوار إنشاء أمر العمل - النسخة المحسنة */}
      {selectedItemId && (
        <NonComplianceWorkOrderDialog
          open={woDialogOpen}
          onOpenChange={setWoDialogOpen}
          itemName={getItemName(selectedItemId)}
          itemNameAr={getItemNameAr(selectedItemId)}
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
    </div>
  );
}