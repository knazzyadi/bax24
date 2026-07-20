// src/app/[locale]/(dashboard)/inspections/[id]/InspectionItemsCard.tsx
"use client";

import { ClipboardCheck, CheckCircle2, XCircle, MinusCircle, Wrench, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useState } from "react";
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
import { Loader2 } from "lucide-react";

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
  const [woLocation, setWoLocation] = useState<"location" | "asset">("location");
  const [woPriority, setWoPriority] = useState<"low" | "medium" | "high" | "critical">("high");
  const [creatingWO, setCreatingWO] = useState(false);

  // حساب الإحصائيات
  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const completedItems = Object.values(resultsState).filter(r => r.result !== "na").length;
  const pendingCount = totalItems - completedItems;

  // ✅ التحقق من وجود بنود
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

  // إنشاء أمر العمل
  const handleCreateWorkOrder = async () => {
    if (!selectedItemId) return;
    const result = resultsState[selectedItemId];
    if (!result) return;

    setCreatingWO(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onUpdateResult(selectedItemId, "workOrderId", `WO-${Date.now().toString().slice(-6)}`);
      toast.success(isRtl ? "تم إنشاء أمر العمل بنجاح" : "Work order created successfully");
      setWoDialogOpen(false);
    } catch (err) {
      toast.error(isRtl ? "فشل إنشاء أمر العمل" : "Failed to create work order");
    } finally {
      setCreatingWO(false);
    }
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

  const textAlign = isRtl ? "text-right" : "text-left";

  return (
    <>
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
        {/* رأس البطاقة */}
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
        </div>

        {hasItems ? (
          <>
            {/* معلومات إضافية */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {t("itemsCount", { count: totalItems })}
                {pendingCount > 0 && (
                  <span className="text-amber-500 dark:text-amber-400 ml-2 font-medium">
                    ({t("pendingCount", { count: pendingCount })})
                  </span>
                )}
              </span>
            </div>

            {/* ✅ الجدول */}
            <div className="border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead className={cn("text-slate-600 dark:text-slate-300 font-semibold", textAlign)}>
                      {isRtl ? "البند" : "Item"}
                    </TableHead>
                    <TableHead className={cn("text-slate-600 dark:text-slate-300 font-semibold", textAlign)}>
                      {isRtl ? "التصنيف" : "Category"}
                    </TableHead>
                    <TableHead className={cn("text-slate-600 dark:text-slate-300 font-semibold", textAlign)}>
                      {isRtl ? "كود سيباهي" : "CBAHI Code"}
                    </TableHead>
                    <TableHead className={cn("text-slate-600 dark:text-slate-300 font-semibold", textAlign)}>
                      {isRtl ? "الحالة" : "Status"}
                    </TableHead>
                    <TableHead className={cn("text-slate-600 dark:text-slate-300 font-semibold", textAlign)}>
                      {isRtl ? "ملاحظات" : "Notes"}
                    </TableHead>
                    <TableHead className={cn("text-slate-600 dark:text-slate-300 font-semibold", textAlign)}>
                      {t("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) =>
                    category.items.map((item) => {
                      const result = resultsState[item.id];
                      const isFail = result?.result === "fail";
                      const hasWO = !!result?.workOrderId;

                      return (
                        <TableRow
                          key={item.id}
                          className={cn(
                            "hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors",
                            isFail && "bg-rose-50/30 dark:bg-rose-950/10"
                          )}
                        >
                          <TableCell className={cn("font-medium text-slate-800 dark:text-slate-100", textAlign)}>
                            {isRtl ? item.nameAr || item.name : item.name}
                          </TableCell>
                          <TableCell className={cn("text-slate-600 dark:text-slate-400", textAlign)}>
                            {isRtl ? category.categoryNameAr || category.categoryName : category.categoryName}
                          </TableCell>
                          <TableCell className={cn("font-mono text-xs text-slate-500 dark:text-slate-400", textAlign)}>
                            {item.cbahiCode || "—"}
                          </TableCell>
                          <TableCell className={textAlign}>
                            {getStatusBadge(result?.result)}
                            {hasWO && (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-none ml-2">
                                <Wrench className="h-3 w-3 mr-1" />
                                WO #{result?.workOrderId?.slice(0, 6)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className={textAlign}>
                            <Textarea
                              placeholder={isRtl ? "أضف ملاحظة..." : "Add note..."}
                              value={result?.notes || ""}
                              onChange={(e) => onUpdateResult(item.id, "notes", e.target.value)}
                              className="min-h-[40px] text-sm rounded-xl bg-white/70 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700/50 resize-none"
                            />
                          </TableCell>
                          <TableCell className={textAlign}>
                            <div className="flex items-center justify-end gap-2">
                              {/* أزرار التقييم */}
                              <Button
                                variant={result?.result === "pass" ? "default" : "ghost"}
                                size="sm"
                                className={cn(
                                  "rounded-full h-8 w-8 p-0",
                                  result?.result === "pass"
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                                )}
                                onClick={() => onUpdateResult(item.id, "result", "pass")}
                                title={isRtl ? "مطابق" : "Pass"}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={result?.result === "fail" ? "default" : "ghost"}
                                size="sm"
                                className={cn(
                                  "rounded-full h-8 w-8 p-0",
                                  result?.result === "fail"
                                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                                    : "text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                                )}
                                onClick={() => onUpdateResult(item.id, "result", "fail")}
                                title={isRtl ? "غير مطابق" : "Fail"}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={result?.result === "na" ? "default" : "ghost"}
                                size="sm"
                                className={cn(
                                  "rounded-full h-8 w-8 p-0",
                                  result?.result === "na"
                                    ? "bg-slate-600 hover:bg-slate-700 text-white"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-400"
                                )}
                                onClick={() => onUpdateResult(item.id, "result", "na")}
                                title="N/A"
                              >
                                <MinusCircle className="h-4 w-4" />
                              </Button>

                              {/* زر إنشاء أمر العمل (للحالات غير المطابقة فقط) */}
                              {isFail && (
                                <Button
                                  variant={hasWO ? "default" : "destructive"}
                                  size="sm"
                                  className={cn(
                                    "rounded-full h-8 w-8 p-0",
                                    hasWO
                                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                                      : "bg-rose-500 hover:bg-rose-600 text-white"
                                  )}
                                  disabled={hasWO}
                                  onClick={() => openWoDialog(item.id)}
                                  title={hasWO ? (isRtl ? "تم التحويل" : "Converted") : (isRtl ? "تحويل لأمر عمل" : "To WO")}
                                >
                                  <Wrench className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <p className="text-slate-400 dark:text-slate-500 text-center py-6">
            {t("noItems")}
          </p>
        )}
      </div>

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