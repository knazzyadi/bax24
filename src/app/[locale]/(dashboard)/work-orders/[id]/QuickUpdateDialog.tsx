// src/app/[locale]/(dashboard)/work-orders/[id]/QuickUpdateDialog.tsx
"use client";

import { useState } from "react";
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
  onUpdate: (data: {
    statusId: string;
    priorityId: string;
    notes: string;
  }) => Promise<void>;
  isUpdating: boolean;
  isRtl: boolean;
}

export function QuickUpdateDialog({
  onOpenChange,
  currentStatus,
  currentPriority,
  statuses,
  priorities,
  onUpdate,
  isUpdating,
  isRtl,
}: QuickUpdateDialogProps) {
  const t = useTranslations("WorkOrders");

  const [selectedStatusId, setSelectedStatusId] = useState(
    currentStatus?.id || ""
  );

  const [selectedPriorityId, setSelectedPriorityId] = useState(
    currentPriority?.id || ""
  );

  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    await onUpdate({
      statusId: selectedStatusId,
      priorityId: selectedPriorityId,
      notes,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-slate-100 text-xl font-bold">
            {isRtl ? "تحديث سريع" : "Quick Update"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">

          <div className="space-y-1.5">
            <Label>
              {isRtl ? "الحالة" : "Status"}
            </Label>

            <Select
              value={selectedStatusId}
              onValueChange={setSelectedStatusId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {isRtl
                      ? status.name
                      : status.nameEn || status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <div className="space-y-1.5">
            <Label>
              {isRtl ? "الأولوية" : "Priority"}
            </Label>

            <Select
              value={selectedPriorityId}
              onValueChange={setSelectedPriorityId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority.id} value={priority.id}>
                    {isRtl
                      ? priority.name
                      : priority.nameEn || priority.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <div className="space-y-1.5">
            <Label>
              {isRtl ? "ملاحظات" : "Notes"}
            </Label>

            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isRtl
                  ? "أضف ملاحظة جديدة"
                  : "Add a new note"
              }
            />
          </div>

        </div>


        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isUpdating || !selectedStatusId}
          >
            {isUpdating && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}

            {isRtl ? "تحديث" : "Update"}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}