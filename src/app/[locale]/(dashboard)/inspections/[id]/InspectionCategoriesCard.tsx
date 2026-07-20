// src/app/[locale]/(dashboard)/inspections/[id]/InspectionCategoriesCard.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, MinusCircle, Camera, Wrench, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  cbahiCode?: string;
  result: ResultState | null;
}

interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  categoryNameAr?: string;
  items: CategoryItem[];
}

interface InspectionCategoriesCardProps {
  categories: CategoryGroup[];
  resultsState: Record<string, ResultState>;
  onUpdateResult: (itemId: string, field: keyof ResultState, value: any) => void;
  isRtl: boolean;
}

// ============================================================
// المكون الرئيسي
// ============================================================
export function InspectionCategoriesCard({
  categories,
  resultsState,
  onUpdateResult,
  isRtl,
}: InspectionCategoriesCardProps) {
  // حالة حوار إنشاء أمر العمل
  const [woDialogOpen, setWoDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [woLocation, setWoLocation] = useState<"location" | "asset">("location");
  const [woPriority, setWoPriority] = useState<"low" | "medium" | "high" | "critical">("high");
  const [creatingWO, setCreatingWO] = useState(false);

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

  // إنشاء أمر العمل
  const handleCreateWorkOrder = async () => {
    if (!selectedItemId) return;

    const result = resultsState[selectedItemId];
    if (!result) return;

    setCreatingWO(true);
    try {
      // هنا استدعاء API إنشاء أمر العمل
      const payload = {
        title: `فحص: ${result.itemId}`,
        description: result.notes || "تم التحويل من الفحص",
        priority: woPriority,
        source: "inspection",
        sourceId: "inspection-id-placeholder", // سيتم استبداله بالـ ID الحقيقي
      };

      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create work order");

      const data = await res.json();

      // تحديث النتيجة بربط أمر العمل
      onUpdateResult(selectedItemId, "workOrderId", data.id);

      toast.success(isRtl ? "تم إنشاء أمر العمل بنجاح" : "Work order created successfully");
      setWoDialogOpen(false);
    } catch (err) {
      toast.error(isRtl ? "فشل إنشاء أمر العمل" : "Failed to create work order");
    } finally {
      setCreatingWO(false);
    }
  };

  return (
    <>
      {/* ✅ الحاوية الرئيسية (مثل AssetsCard) */}
      <Card className="bg-white/70 dark:bg-slate-900/70 border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        {/* رأس الحاوية */}
        <CardHeader className="border-b border-slate-100/50 dark:border-slate-800/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {isRtl ? "بنود الفحص" : "Inspection Items"}
            </CardTitle>
            <Badge variant="outline" className="rounded-full">
              {categories.reduce((acc, cat) => acc + cat.items.length, 0)} {isRtl ? "بند" : "items"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-slate-100/50 dark:divide-slate-800/50">
          {categories.map((category) => (
            <div key={category.categoryId} className="p-6 space-y-4">
              {/* عنوان الفئة الفرعية */}
              <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-500 rounded-full" />
                {isRtl ? category.categoryNameAr || category.categoryName : category.categoryName}
                <Badge variant="secondary" className="rounded-full text-xs">
                  {category.items.length}
                </Badge>
              </h3>

              {/* قائمة البنود */}
              <div className="space-y-3">
                {category.items.map((item) => {
                  const result = resultsState[item.id];
                  const isFail = result?.result === "fail";
                  const hasWO = !!result?.workOrderId;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-200",
                        isFail
                          ? "border-rose-200 bg-rose-50/30 dark:border-rose-800/50 dark:bg-rose-950/20"
                          : result?.result === "pass"
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
                              <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-none">
                                {isRtl ? "غير مطابق" : "FAIL"}
                              </Badge>
                            )}
                            {hasWO && (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-none">
                                <Wrench className="h-3 w-3 mr-1" />
                                WO #{result?.workOrderId?.slice(0, 6)}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* أزرار التقييم */}
                        <div className="flex items-center gap-1" dir="ltr">
                          <Button
                            size="sm"
                            variant={result?.result === "pass" ? "default" : "outline"}
                            className={cn(
                              "rounded-xl px-3 h-8",
                              result?.result === "pass"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "border-slate-300"
                            )}
                            onClick={() => onUpdateResult(item.id, "result", "pass")}
                          >
                            <CheckCircle className="h-4 w-4 ml-1" /> {isRtl ? "مطابق" : "Pass"}
                          </Button>
                          <Button
                            size="sm"
                            variant={result?.result === "fail" ? "default" : "outline"}
                            className={cn(
                              "rounded-xl px-3 h-8",
                              result?.result === "fail"
                                ? "bg-rose-600 hover:bg-rose-700 text-white"
                                : "border-slate-300"
                            )}
                            onClick={() => onUpdateResult(item.id, "result", "fail")}
                          >
                            <XCircle className="h-4 w-4 ml-1" /> {isRtl ? "غير مطابق" : "Fail"}
                          </Button>
                          <Button
                            size="sm"
                            variant={result?.result === "na" ? "default" : "outline"}
                            className={cn(
                              "rounded-xl px-3 h-8",
                              result?.result === "na"
                                ? "bg-slate-600 hover:bg-slate-700 text-white"
                                : "border-slate-300"
                            )}
                            onClick={() => onUpdateResult(item.id, "result", "na")}
                          >
                            <MinusCircle className="h-4 w-4 ml-1" /> N/A
                          </Button>
                        </div>
                      </div>

                      {/* الملاحظات والإجراءات */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
                        <div className="md:col-span-3">
                          <Textarea
                            placeholder={isRtl ? "أضف ملاحظة..." : "Add note..."}
                            value={result?.notes || ""}
                            onChange={(e) => onUpdateResult(item.id, "notes", e.target.value)}
                            className="min-h-[50px] text-sm rounded-xl bg-white/70 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700/50"
                          />
                        </div>
                        <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" className="rounded-xl h-9">
                            <Camera className="h-4 w-4 ml-1" /> {isRtl ? "صورة" : "Photo"}
                          </Button>
                          {result?.result === "fail" && (
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
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="p-6 text-center text-slate-400 dark:text-slate-500">
              {isRtl ? "لا توجد بنود مضافة لهذا الفحص" : "No items added to this inspection"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* حوار إنشاء أمر العمل */}
      <Dialog open={woDialogOpen} onOpenChange={setWoDialogOpen}>
        <DialogContent className="rounded-3xl bg-white/95 dark:bg-slate-900/95">
          <DialogHeader>
            <DialogTitle>{isRtl ? "تحويل لأمر عمل" : "Convert to Work Order"}</DialogTitle>
            <DialogDescription>
              {isRtl
                ? "سيتم إنشاء أمر صيانة بناءً على البند غير المطابق"
                : "A maintenance order will be created based on the failed item"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRtl ? "نوع الأمر" : "Order Type"}</Label>
              <Select value={woLocation} onValueChange={(v: any) => setWoLocation(v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="location">{isRtl ? "موقع (غرفة/مبنى)" : "Location (Room/Building)"}</SelectItem>
                  <SelectItem value="asset">{isRtl ? "أصل (معدة)" : "Asset (Equipment)"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? "الأولوية" : "Priority"}</Label>
              <Select value={woPriority} onValueChange={(v: any) => setWoPriority(v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{isRtl ? "منخفضة" : "Low"}</SelectItem>
                  <SelectItem value="medium">{isRtl ? "متوسطة" : "Medium"}</SelectItem>
                  <SelectItem value="high">{isRtl ? "عالية" : "High"}</SelectItem>
                  <SelectItem value="critical">{isRtl ? "حرجة" : "Critical"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWoDialogOpen(false)} disabled={creatingWO}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleCreateWorkOrder} disabled={creatingWO} className="bg-indigo-600 hover:bg-indigo-700">
              {creatingWO && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isRtl ? "إنشاء الأمر" : "Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}