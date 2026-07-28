// src/app/[locale]/(dashboard)/work-orders/[id]/ClientWrapper.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Wrench, FileText, MapPin, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

// ✅ استيرادات مباشرة من الملفات في جذر work-orders
import { DetailsCard } from "./DetailsCard";
import { AssetsCard } from "./AssetsCard";
import { SparePartsCard } from "./SparePartsCard";
import { AttachmentsCard } from "../AttachmentsCard";
import { CompleteAssetDialog } from "./CompleteAssetDialog";
import { NotesViewer } from "./NotesViewer";
import { QuickUpdateDialog } from "./QuickUpdateDialog";
import { LocationCard } from "../LocationCard";
import { InfoBar } from "../InfoBar";
import { WorkOrderActions } from "./WorkOrderActions";
import { WorkOrderAuditLog } from "./WorkOrderAuditLog";
import { glassCard } from "../constants";

// تعريف الأنواع (مع إضافة building, floor, room كعلاقات مباشرة)
interface WorkOrderAsset {
  assetId: string;
  completedAt: string | null;
  notes: string | null;
  asset: {
    id: string;
    name: string;
    nameEn?: string;
    code: string;
  };
}

interface WorkOrderDetailData {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: string;
  workOrderType: {
    id: string;
    name: string;
    nameEn?: string | null;
  } | null;
  priority: { id: string; name: string; nameEn?: string; color?: string } | null;
  status: { id: string; name: string; nameEn?: string; color?: string } | null;
  // ✅ إضافة العلاقات المباشرة للموقع
  building: { id: string; name: string; nameEn?: string } | null;
  floor: { id: string; name: string; nameEn?: string } | null;
  room: { id: string; name: string; nameEn?: string } | null;
  branch: { id: string; name: string; nameEn?: string } | null;
  assetType: any;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  workOrderAssets: WorkOrderAsset[];
  ticketId: string | null;
  attachments: any[];
  source: "manual" | "ticket" | "pm" | "checklist";
  sourceId: string | null;
  reason: string | null;
  createdBy: { id: string; name: string; email: string } | null;
  assignedTo: { id: string; name: string; email: string } | null;
}

interface WorkOrderDetailClientProps {
  initialData: WorkOrderDetailData;
  canEdit: boolean;
  canDelete: boolean;
  locale: string;
  statuses: { id: string; name: string; nameEn?: string; color?: string }[];
  priorities: { id: string; name: string; nameEn?: string; color?: string }[];
}

export function WorkOrderDetailClient({
  initialData,
  canEdit,
  canDelete,
  locale,
  statuses,
  priorities,
}: WorkOrderDetailClientProps) {
  const router = useRouter();
  const isRtl = locale === "ar";
  const t = useTranslations("WorkOrders");

  const [workOrder, setWorkOrder] = useState(initialData);
  const [actionLoading, setActionLoading] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<WorkOrderAsset | null>(null);
  const [completionNote, setCompletionNote] = useState("");

  const [quickUpdateOpen, setQuickUpdateOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const refreshData = async () => {
    try {
      const res = await fetch(`/api/work-orders/${workOrder.id}`);
      if (res.ok) {
        const data = await res.json();
        setWorkOrder({
          ...data,
          attachments: data.attachments || [],
          workOrderType: data.workOrderType || null,
        });
      }
    } catch (error) {
      console.error("Failed to refresh data", error);
    }
  };

  const handleQuickUpdate = async (data: { statusId: string; priorityId: string; notes: string }) => {
    setIsUpdating(true);
    try {
      const currentNotes = workOrder.notes || "";
      const updatedNotes = data.notes.trim()
        ? (currentNotes ? `${currentNotes}\n${data.notes}` : data.notes)
        : currentNotes;

      const res = await fetch(`/api/work-orders/${workOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusId: data.statusId,
          priorityId: data.priorityId,
          notes: updatedNotes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل التحديث");
      }
      toast.success(isRtl ? "تم التحديث بنجاح" : "Updated successfully");
      await refreshData();
      setQuickUpdateOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const pendingAssetsCount = workOrder.workOrderAssets.filter(
    (woa) => !woa.completedAt
  ).length;

  const hasAssets = workOrder.workOrderAssets.length > 0;

  const handleCompleteAsset = async (assetId: string, note: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${workOrder.id}/assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedAt: new Date().toISOString(),
          notes: note || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to complete");
      toast.success(t("assetCompleted"));
      await refreshData();
      setCompleteDialogOpen(false);
      setCompletionNote("");
      setSelectedAsset(null);
    } catch (error) {
      console.error(error);
      toast.error(t("completeError"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteAll = async () => {
    const pending = workOrder.workOrderAssets.filter((woa) => !woa.completedAt);
    if (pending.length === 0) {
      toast.info(t("allAlreadyCompleted"));
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${workOrder.id}/complete-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedAt: new Date().toISOString(),
          notes: completionNote || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to complete all");
      toast.success(t("allCompleted"));
      await refreshData();
      setCompleteDialogOpen(false);
      setCompletionNote("");
    } catch (error) {
      console.error(error);
      toast.error(t("completeAllError"));
    } finally {
      setActionLoading(false);
    }
  };

  const openCompleteDialog = (asset: WorkOrderAsset | null = null) => {
    setSelectedAsset(asset);
    setCompletionNote("");
    setCompleteDialogOpen(true);
  };

  const getSourceLabel = () => {
    const labels: Record<WorkOrderDetailData["source"], string> = {
      manual: isRtl ? "إنشاء مباشر" : "Manual",
      ticket: isRtl ? "بلاغ" : "Ticket",
      pm: isRtl ? "صيانة وقائية" : "Preventive Maintenance",
      checklist: isRtl ? "قائمة فحص" : "Checklist",
    };
    return labels[workOrder.source] || workOrder.source;
  };

  const getSourceIcon = () => {
    const icons = {
      manual: "📝",
      ticket: "🎫",
      pm: "🔧",
      checklist: "✅",
    };
    return icons[workOrder.source] || "📋";
  };

  // ✅ بناء سلسلة الموقع الكاملة من العلاقات المباشرة
  const locationParts = [];
  if (workOrder.branch) {
    locationParts.push(isRtl ? workOrder.branch.name : workOrder.branch.nameEn || workOrder.branch.name);
  }
  if (workOrder.building) {
    locationParts.push(isRtl ? workOrder.building.name : workOrder.building.nameEn || workOrder.building.name);
  }
  if (workOrder.floor) {
    locationParts.push(isRtl ? workOrder.floor.name : workOrder.floor.nameEn || workOrder.floor.name);
  }
  if (workOrder.room) {
    locationParts.push(isRtl ? workOrder.room.name : workOrder.room.nameEn || workOrder.room.name);
  }

  const locationString = locationParts.length > 0 ? locationParts.join(" → ") : (isRtl ? "غير محدد" : "Not specified");

  return (
    <div className="relative space-y-8 p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Wrench className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {workOrder.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <WorkOrderActions
            workOrderId={workOrder.id}
            locale={locale}
            canEdit={canEdit}
            canDelete={canDelete}
          />
          <Link
            href={`/${locale}/work-orders`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 transition-all duration-200"
          >
            {isRtl ? "العودة إلى القائمة" : "Back to list"}
          </Link>
        </div>
      </div>

      <InfoBar
        code={workOrder.code}
        createdAt={workOrder.createdAt}
        createdBy={workOrder.createdBy?.name || "Unknown"}
        isRtl={isRtl}
        source={{
          label: getSourceLabel(),
          icon: getSourceIcon(),
        }}
        status={
          workOrder.status
            ? {
                name: isRtl ? workOrder.status.name : workOrder.status.nameEn || workOrder.status.name,
                color: workOrder.status.color || undefined,
              }
            : undefined
        }
        priority={
          workOrder.priority
            ? {
                name: isRtl ? workOrder.priority.name : workOrder.priority.nameEn || workOrder.priority.name,
                color: workOrder.priority.color || undefined,
              }
            : undefined
        }
        className="mb-6"
        onQuickUpdate={() => setQuickUpdateOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ========== العمود الرئيسي ========== */}
        <div className="lg:col-span-2 space-y-8">
          <div className={glassCard}>
            <DetailsCard workOrder={workOrder} isRtl={isRtl} t={t} />
          </div>

          <div className={glassCard}>
            <AssetsCard
              workOrderAssets={workOrder.workOrderAssets}
              pendingCount={pendingAssetsCount}
              hasAssets={hasAssets}
              onCompleteAsset={openCompleteDialog}
              onCompleteAll={() => openCompleteDialog(null)}
              isRtl={isRtl}
              t={t}
              actionLoading={actionLoading}
              locale={locale}
            />
          </div>

          <div className={glassCard}>
            <SparePartsCard workOrderId={workOrder.id} locale={locale} />
          </div>

          {workOrder.notes && (
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                  <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {isRtl ? "ملاحظات" : "Notes"}
                </h3>
              </div>
              <NotesViewer notes={workOrder.notes} isRtl={isRtl} t={t} />
            </div>
          )}

          <div className={glassCard}>
            <WorkOrderAuditLog workOrderId={workOrder.id} />
          </div>
        </div>

        {/* ========== العمود الجانبي ========== */}
        <div className="space-y-6">
          {/* المرفقات */}
          {workOrder.attachments && workOrder.attachments.length > 0 && (
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40">
                  <span className="h-5 w-5 text-rose-600 dark:text-rose-400">📎</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {isRtl ? "المرفقات" : "Attachments"}
                </h3>
              </div>
              <div className="space-y-2">
                {workOrder.attachments.map((att: any) => (
                  <a
                    key={att.id}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <span className="text-blue-500">📄</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                      {att.originalName || att.fileName}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* معلومات إضافية */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                <span className="h-5 w-5 text-blue-600 dark:text-blue-400">📅</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "معلومات إضافية" : "Additional Info"}
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("createdAt")}
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {new Date(workOrder.createdAt).toLocaleDateString(
                    isRtl ? "ar-SA" : "en-US",
                    { day: "2-digit", month: "2-digit", year: "numeric" }
                  )}
                </p>
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("updatedAt")}
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {new Date(workOrder.updatedAt).toLocaleDateString(
                    isRtl ? "ar-SA" : "en-US",
                    { day: "2-digit", month: "2-digit", year: "numeric" }
                  )}
                </p>
              </div>
              {workOrder.assignedTo && (
                <div>
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {isRtl ? "مسند إلى" : "Assigned To"}
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {workOrder.assignedTo.name}
                  </p>
                </div>
              )}
              {workOrder.branch && (
                <div>
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {t("branch")}
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {isRtl
                      ? workOrder.branch.name
                      : workOrder.branch.nameEn || workOrder.branch.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ✅ الموقع - عرض السلسلة الكاملة بدون LocationCard */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "الموقع" : "Location"}
              </h3>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              {locationParts.length > 0 ? (
                locationParts.map((part, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && (
                      <span className="text-muted-foreground text-xs">
                        {isRtl ? "←" : "→"}
                      </span>
                    )}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {part}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground">
                  {isRtl ? "غير محدد" : "Not specified"}
                </span>
              )}
            </div>
          </div>

          {/* زر الطباعة */}
          <div className={glassCard}>
            <Link
              href={`/${locale}/work-orders/${workOrder.id}/print`}
              target="_blank"
              className="no-print block"
            >
              <Button
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 gap-2"
              >
                <Printer className="h-5 w-5" />
                {isRtl ? "طباعة التقرير" : "Print Report"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <CompleteAssetDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        selectedAsset={selectedAsset}
        completionNote={completionNote}
        onCompletionNoteChange={setCompletionNote}
        onConfirm={() => {
          if (selectedAsset) {
            handleCompleteAsset(selectedAsset.assetId, completionNote);
          } else {
            handleCompleteAll();
          }
        }}
        isSubmitting={actionLoading}
        isRtl={isRtl}
        t={t}
      />

      <QuickUpdateDialog
        open={quickUpdateOpen}
        onOpenChange={setQuickUpdateOpen}
        currentStatus={workOrder.status}
        currentPriority={workOrder.priority}
        currentNotes={workOrder.notes}
        statuses={statuses}
        priorities={priorities}
        onUpdate={handleQuickUpdate}
        isUpdating={isUpdating}
        isRtl={isRtl}
      />
    </div>
  );
}