// src/app/[locale]/(dashboard)/settings/work-order-close-reasons/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "@/lib/client-guard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { WorkOrderCloseReasonTable } from "./WorkOrderCloseReasonTable";
import { WorkOrderCloseReasonDialog } from "./WorkOrderCloseReasonDialog";
import { useSettingsData } from "@/hooks/useSettingsData";
import type { WorkOrderCloseReason } from "@/types/work-orders";

const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300";

export default function WorkOrderCloseReasonsPage() {
  const t = useTranslations("WorkOrderCloseReasons");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const { data: reasons, loading, refetch } = useSettingsData<WorkOrderCloseReason>({
    apiEndpoint: "/api/work-order-close-reasons",
    locale,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<WorkOrderCloseReason | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id?: string }>({ open: false });
  const [deleting, setDeleting] = useState(false);

  const handleCreate = () => {
    setEditingReason(null);
    setDialogOpen(true);
  };

  const handleEdit = (reason: WorkOrderCloseReason) => {
    setEditingReason(reason);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/work-order-close-reasons/${confirmDialog.id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل الحذف");
      }
      toast.success(t("deleteSuccess"));
      refetch();
      setConfirmDialog({ open: false });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDialogClose = (refetchData?: boolean) => {
    setDialogOpen(false);
    setEditingReason(null);
    if (refetchData) refetch();
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
        {/* ✅ خلفية متدرجة خضراء/زمردية */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 via-transparent to-teal-100/20 dark:from-emerald-950/10 dark:via-transparent dark:to-teal-950/10 rounded-3xl -z-10" />

        <header className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 border border-emerald-200/30 dark:border-emerald-800/30 shadow-lg shadow-emerald-500/5">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
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
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
            ) : (
              <WorkOrderCloseReasonTable
                data={reasons}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                isRtl={isRtl}
              />
            )}
          </div>
        </div>

        <WorkOrderCloseReasonDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          reason={editingReason}
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