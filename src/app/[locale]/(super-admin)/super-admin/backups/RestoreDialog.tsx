// src/app/[locale]/(super-admin)/super-admin/backups/RestoreDialog.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupId: string;
  companyName: string;
  onRestoreComplete: () => void;
  isRtl: boolean;
}

type RestoreType = "full" | "config" | "custom";

const MODULES = [
  { id: "buildings", labelEn: "Buildings", labelAr: "المباني" },
  { id: "floors", labelEn: "Floors", labelAr: "الأدوار" },
  { id: "rooms", labelEn: "Rooms", labelAr: "الغرف" },
  { id: "assets", labelEn: "Assets", labelAr: "الأصول" },
  { id: "workOrders", labelEn: "Work Orders", labelAr: "أوامر العمل" },
  { id: "inspections", labelEn: "Inspections", labelAr: "الفحوصات" },
  { id: "settings", labelEn: "Settings", labelAr: "الإعدادات" },
];

export function RestoreDialog({
  open,
  onOpenChange,
  backupId,
  companyName,
  onRestoreComplete,
  isRtl,
}: RestoreDialogProps) {
  const t = useTranslations("SuperAdmin.Backups");
  const [restoreType, setRestoreType] = useState<RestoreType>("full");
  const [selectedModules, setSelectedModules] = useState<string[]>(
    MODULES.map((m) => m.id)
  );
  const [isRestoring, setIsRestoring] = useState(false);

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const res = await fetch(`/api/admin/company-backups/${backupId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restoreType,
          modules: restoreType === "custom" ? selectedModules : undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Restore failed");
      }

      toast.success(isRtl ? "تم استرجاع النسخة بنجاح" : "Backup restored successfully");
      onRestoreComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || (isRtl ? "فشل الاسترجاع" : "Restore failed"));
    } finally {
      setIsRestoring(false);
    }
  };

  const getModuleLabel = (moduleId: string) => {
    const mod = MODULES.find((m) => m.id === moduleId);
    return mod ? (isRtl ? mod.labelAr : mod.labelEn) : moduleId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl bg-white/95 dark:bg-slate-900/95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            {isRtl ? "استرجاع النسخة الاحتياطية" : "Restore Backup"}
          </DialogTitle>
          <DialogDescription>
            {isRtl
              ? `سيتم استرجاع بيانات شركة "${companyName}" من النسخة الاحتياطية.`
              : `Data of company "${companyName}" will be restored from the backup.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* نوع الاسترجاع - باستخدام Select */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {isRtl ? "نوع الاسترجاع" : "Restore Type"}
            </Label>
            <Select
              value={restoreType}
              onValueChange={(v) => setRestoreType(v as RestoreType)}
            >
              <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-slate-700">
                <SelectValue placeholder={isRtl ? "اختر نوع الاسترجاع" : "Select restore type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">
                  {isRtl ? "استرجاع كامل (جميع البيانات)" : "Full Restore (All Data)"}
                </SelectItem>
                <SelectItem value="config">
                  {isRtl ? "استرجاع الإعدادات فقط" : "Configuration Only"}
                </SelectItem>
                <SelectItem value="custom">
                  {isRtl ? "استرجاع جزئي (اختيار الوحدات)" : "Advanced Restore (Select Modules)"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* اختيار الوحدات (للجزئي) - باستخدام أزرار بدلاً من Checkbox */}
          {restoreType === "custom" && (
            <div className="space-y-3 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
              <Label className="text-base font-semibold">
                {isRtl ? "اختر الوحدات المراد استرجاعها" : "Select Modules to Restore"}
              </Label>
              <div className="flex flex-wrap gap-2">
                {MODULES.map((module) => {
                  const isSelected = selectedModules.includes(module.id);
                  return (
                    <Button
                      key={module.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleModuleToggle(module.id)}
                      className={cn(
                        "rounded-xl h-8 px-3 text-sm transition-all",
                        isSelected
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "border-slate-300 hover:border-indigo-400"
                      )}
                    >
                      {isRtl ? module.labelAr : module.labelEn}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* تحذير */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              {isRtl
                ? "سيتم إنشاء نسخة احتياطية تلقائية قبل الاسترجاع للرجوع إليها في حالة حدوث أي خطأ."
                : "An automatic backup will be created before restoration to revert in case of any error."}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRestoring}
            className="rounded-xl"
          >
            {isRtl ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={handleRestore}
            disabled={isRestoring}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isRestoring && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isRtl ? "بدء الاسترجاع" : "Start Restore"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}