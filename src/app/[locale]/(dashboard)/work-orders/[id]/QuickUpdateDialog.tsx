// src/app/[locale]/(dashboard)/work-orders/[id]/components/QuickUpdateDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface QuickUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: { id: string; name: string; nameEn?: string; color?: string } | null;
  currentPriority: { id: string; name: string; nameEn?: string; color?: string } | null;
  currentNotes: string | null;
  statuses: { id: string; name: string; nameEn?: string; color?: string }[];
  priorities: { id: string; name: string; nameEn?: string; color?: string }[];
  onUpdate: (data: { statusId: string; priorityId: string; notes: string }) => Promise<void>;
  isUpdating: boolean;
  isRtl: boolean;
}

export function QuickUpdateDialog({
  open,
  onOpenChange,
  currentStatus,
  currentPriority,
  currentNotes,
  statuses,
  priorities,
  onUpdate,
  isUpdating,
  isRtl,
}: QuickUpdateDialogProps) {
  const t = useTranslations("WorkOrders");
  const [selectedStatusId, setSelectedStatusId] = useState<string>("");
  const [selectedPriorityId, setSelectedPriorityId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (open) {
      setSelectedStatusId(currentStatus?.id || "");
      setSelectedPriorityId(currentPriority?.id || "");
      setNotes(""); // ✅ فارغ دائماً
    }
  }, [open, currentStatus, currentPriority]);

  const handleSubmit = async () => {
    await onUpdate({
      statusId: selectedStatusId,
      priorityId: selectedPriorityId,
      notes: notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-slate-100 text-xl font-bold">
            {isRtl ? "تحديث سريع" : "Quick Update"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {isRtl ? "الحالة" : "Status"}
            </Label>
            <Select value={selectedStatusId} onValueChange={setSelectedStatusId}>
              <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
                <SelectValue placeholder={isRtl ? "اختر الحالة" : "Select status"} />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: status.color || "#94a3b8" }}
                      />
                      {isRtl ? status.name : status.nameEn || status.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {isRtl ? "الأولوية" : "Priority"}
            </Label>
            <Select value={selectedPriorityId} onValueChange={setSelectedPriorityId}>
              <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
                <SelectValue placeholder={isRtl ? "اختر الأولوية" : "Select priority"} />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority.id} value={priority.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: priority.color || "#94a3b8" }}
                      />
                      {isRtl ? priority.name : priority.nameEn || priority.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {isRtl ? "ملاحظات" : "Notes"}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRtl ? "أضف ملاحظة جديدة (ستُضاف في سطر جديد)" : "Add a new note (will be added on a new line)"}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUpdating || !selectedStatusId}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
          >
            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isRtl ? "تحديث" : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}