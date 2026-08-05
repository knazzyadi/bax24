// src/app/[locale]/(dashboard)/inspections/components/CreateFindingModal.tsx

"use client";

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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface CreateFindingModalProps {
  open: boolean;
  onClose: () => void;
  inspectionResultId: string;
  onSuccess?: () => void;
  isRtl: boolean;
  // تم إزالة prop 't' لأنه سيتم استخدام useTranslations محلياً
}

export function CreateFindingModal({
  open,
  onClose,
  inspectionResultId,
  onSuccess,
  isRtl,
}: CreateFindingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== حالة النموذج =====
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [dueDate, setDueDate] = useState<string>("");

  // ===== إعادة تعيين النموذج عند الإغلاق =====
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setRiskLevel("MEDIUM");
    setCorrectiveAction("");
    setDueDate("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ===== إرسال النموذج =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من الحقول المطلوبة
    if (!title.trim()) {
      toast.error(isRtl ? "العنوان مطلوب" : "Title is required");
      return;
    }
    if (!description.trim()) {
      toast.error(isRtl ? "الوصف مطلوب" : "Description is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        inspectionResultId,
        title: title.trim(),
        description: description.trim(),
        riskLevel,
        correctiveAction: correctiveAction.trim() || null,
        dueDate: dueDate || null,
      };

      const res = await fetch("/api/inspection-findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.autoCreated && data.workOrder) {
          toast.success(
            isRtl
              ? `تم إنشاء الملاحظة وأمر العمل ${data.workOrder.code}`
              : `Finding and work order ${data.workOrder.code} created`
          );
        } else {
          toast.success(isRtl ? "تم إنشاء الملاحظة بنجاح" : "Finding created successfully");
        }
        resetForm();
        onClose();
        if (onSuccess) onSuccess();
      } else {
        const error = await res.json();
        toast.error(error.error || (isRtl ? "فشل إنشاء الملاحظة" : "Failed to create finding"));
      }
    } catch {
      toast.error(isRtl ? "حدث خطأ في الشبكة" : "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isRtl ? "إنشاء ملاحظة" : "Create Finding"}</DialogTitle>
          <DialogDescription>
            {isRtl
              ? "أدخل تفاصيل الملاحظة المرتبطة بهذا البند."
              : "Enter the details of the finding for this item."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* العنوان */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              {isRtl ? "العنوان" : "Title"} <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isRtl ? "أدخل عنوان الملاحظة" : "Enter finding title"}
              className="h-10"
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>

          {/* الوصف */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              {isRtl ? "الوصف" : "Description"} <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isRtl ? "صف المشكلة بالتفصيل..." : "Describe the issue in detail..."}
              rows={4}
              className="resize-none"
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>

          {/* مستوى الخطورة */}
          <div className="space-y-2">
            <Label htmlFor="riskLevel" className="text-sm font-medium">
              {isRtl ? "مستوى الخطورة" : "Risk Level"}
            </Label>
            <Select
              value={riskLevel}
              onValueChange={(val) =>
                setRiskLevel(val as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
              }
            >
              <SelectTrigger id="riskLevel" className="h-10">
                <SelectValue placeholder={isRtl ? "اختر المستوى" : "Select level"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">{isRtl ? "منخفض" : "Low"}</SelectItem>
                <SelectItem value="MEDIUM">{isRtl ? "متوسط" : "Medium"}</SelectItem>
                <SelectItem value="HIGH">{isRtl ? "مرتفع" : "High"}</SelectItem>
                <SelectItem value="CRITICAL">{isRtl ? "حرج" : "Critical"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* الإجراء التصحيحي */}
          <div className="space-y-2">
            <Label htmlFor="correctiveAction" className="text-sm font-medium">
              {isRtl ? "الإجراء التصحيحي المقترح" : "Corrective Action"}
            </Label>
            <Textarea
              id="correctiveAction"
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              placeholder={
                isRtl
                  ? "اكتب الإجراء التصحيحي المقترح..."
                  : "Proposed corrective action..."
              }
              rows={3}
              className="resize-none"
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>

          {/* تاريخ الاستحقاق */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-sm font-medium">
              {isRtl ? "تاريخ الاستحقاق" : "Due Date"}
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-10"
              min={format(new Date(), "yyyy-MM-dd")}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRtl
                ? "اتركه فارغاً إذا لم يكن هناك موعد محدد."
                : "Leave empty if no specific deadline."}
            </p>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isRtl ? "حفظ" : "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}