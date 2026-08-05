// src/app/[locale]/(dashboard)/settings/work-order-priorities/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { TrendingUp, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "@/lib/client-guard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { WorkOrderPriorityTable } from "./WorkOrderPriorityTable";
import { WorkOrderPriorityDialog } from "./WorkOrderPriorityDialog";
import { useSettingsData } from "@/hooks/useSettingsData";
import type { WorkOrderPriority } from "@/types/work-orders";

const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300";

export default function WorkOrderPrioritiesPage() {
  const t = useTranslations("WorkOrderPriorities");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const { data: priorities, loading, refetch } = useSettingsData<WorkOrderPriority>({
    apiEndpoint: "/api/work-order-priorities",
    locale,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<WorkOrderPriority | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id?: string }>({ open: false });
  const [deleting, setDeleting] = useState(false);

  const handleCreate = () => {
    setEditingPriority(null);
    setDialogOpen(true);
  };

  const handleEdit = (priority: WorkOrderPriority) => {
    setEditingPriority(priority);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/work-order-priorities/${confirmDialog.id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل الحذف");
      }
      toast.success(t("deleteSuccess"));
      refetch();
      setConfirmDialog({ open: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "حدث خطأ غير معروف";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDialogClose = (refetchData?: boolean) => {
    setDialogOpen(false);
    setEditingPriority(null);
    if (refetchData) refetch();
  };

  // ✅ دالة إعادة الترتيب
  const handleReorder = async (newPriorities: WorkOrderPriority[]) => {
    try {
      const res = await fetch("/api/work-order-priorities/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: newPriorities.map((p) => p.id),
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "فشل تحديث الترتيب");
      }
      toast.success(isRtl ? "تم تحديث الترتيب" : "Order updated");
      refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : (isRtl ? "فشل تحديث الترتيب" : "Failed to update order");
      toast.error(message);
    }
  };

  return (
    <AdminGuard>
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={cn(
          "relative min-h-screen p-6 space-y-8",
          isRtl ? "text-right" : "text-left"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

        <header className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
              <TrendingUp className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {t("title")}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <Button
            onClick={handleCreate}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-11 px-5 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
          >
            <Plus className="h-4 w-4 ml-2" />
            {t("addNew")}
          </Button>
        </header>

        <div className={glassCard}>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <WorkOrderPriorityTable
                data={priorities}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onReorder={handleReorder}
                isRtl={isRtl}
              />
            )}
          </div>
        </div>

        <WorkOrderPriorityDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          priority={editingPriority}
          isRtl={isRtl}
        />

        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ open, id: confirmDialog.id })}
          onConfirm={handleConfirmDelete}
          title={t("confirmDeleteTitle")}
          description={t("confirmDeleteDescription")}
          confirmText={t("delete")}
          cancelText={t("cancel")}
          isLoading={deleting}
        />
      </div>
    </AdminGuard>
  );
}