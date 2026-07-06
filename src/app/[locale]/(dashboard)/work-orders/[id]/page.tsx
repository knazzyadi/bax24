// src/app/[locale]/(dashboard)/work-orders/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  FileText,
  Calendar,
  MapPin,
  Building,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Wrench,
  ArrowLeft,
  Check,
  X,
  Tag,
  User,
  Phone,
  Mail,
  Layers,
  ChevronLeft,
  Sparkles,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { WorkOrderInventory } from "@/components/work-order/WorkOrderInventory";
import { AttachmentsManager } from "@/components/work-order/AttachmentsManager";

// تعريف نوع المرفق (مطابق لـ TicketAttachment)
interface Attachment {
  id: string;
  url: string;
  mimeType?: string;
  originalName?: string;
}

interface WorkOrderAsset {
  id?: string;
  assetId: string;
  asset: {
    id: string;
    name: string;
    nameEn?: string;
    code: string;
  };
  completedAt: string | null;
  notes: string | null;
}

interface WorkOrderDetail {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: string;
  priority: { id: string; name: string; nameEn?: string; color?: string } | null;
  status: { id: string; name: string; nameEn?: string; color?: string } | null;
  room: {
    id: string;
    name: string;
    nameEn?: string;
    floor?: {
      name: string;
      nameEn?: string;
      building?: { name: string; nameEn?: string };
    };
  } | null;
  branch: { id: string; name: string; nameEn?: string } | null;
  assetType: { id: string; name: string; nameEn?: string } | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  workOrderAssets: WorkOrderAsset[];
  createdBy?: string;
  ticketId?: string;
}

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const id = params.id as string;
  const t = useTranslations("WorkOrders");
  const isRtl = locale === "ar";

  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<WorkOrderAsset | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // تحديد صلاحيات المستخدم (يمكنك تعديلها حسب نظام الصلاحيات لديك)
  const canEdit = true; // ✅ يمكن تعديلها بناءً على دور المستخدم

  // كرت الخلفية الزجاجي
  const glassCard =
    "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        const res = await fetch(`/api/work-orders/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setWorkOrder(data);
      } catch (error) {
        console.error(error);
        toast.error(t("fetchError"));
        router.push(`/${locale}/work-orders`);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchWorkOrder();
  }, [id, locale, router, t]);

  // جلب مرفقات التذكرة (الصور)
  useEffect(() => {
    const fetchTicketAttachments = async () => {
      if (!workOrder?.ticketId) return;
      setLoadingAttachments(true);
      try {
        const res = await fetch(`/api/tickets/${workOrder.ticketId}`);
        if (res.ok) {
          const ticketData = await res.json();
          setAttachments(ticketData.attachments || []);
        } else {
          setAttachments([]);
        }
      } catch (error) {
        console.error("Failed to fetch ticket attachments", error);
        setAttachments([]);
      } finally {
        setLoadingAttachments(false);
      }
    };
    fetchTicketAttachments();
  }, [workOrder?.ticketId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const localeObj = locale === "ar" ? arSA : enUS;
    return format(date, "PPP", { locale: localeObj });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "MAINTENANCE": return t("type_maintenance");
      case "CORRECTIVE": return t("type_corrective");
      case "EMERGENCY": return t("type_emergency");
      case "BULK_PREVENTIVE": return t("type_bulk_preventive");
      default: return type;
    }
  };

  const getStatusColor = (color?: string) => {
    if (color) return color;
    return "#6b7280";
  };

  const handleCompleteAsset = async () => {
    if (!selectedAsset) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${id}/assets/${selectedAsset.assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedAt: new Date().toISOString(),
          notes: completionNote || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to complete");
      toast.success(t("assetCompleted"));
      setWorkOrder((prev) => {
        if (!prev) return prev;
        const updatedAssets = prev.workOrderAssets.map((woa) =>
          woa.assetId === selectedAsset.assetId
            ? { ...woa, completedAt: new Date().toISOString(), notes: completionNote || null }
            : woa
        );
        return { ...prev, workOrderAssets: updatedAssets };
      });
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
    const pendingAssets = workOrder?.workOrderAssets.filter((woa) => !woa.completedAt) || [];
    if (pendingAssets.length === 0) {
      toast.info(t("allAlreadyCompleted"));
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${id}/complete-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedAt: new Date().toISOString(),
          notes: completionNote || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to complete all");
      toast.success(t("allCompleted"));
      setWorkOrder((prev) => {
        if (!prev) return prev;
        const updatedAssets = prev.workOrderAssets.map((woa) =>
          !woa.completedAt
            ? { ...woa, completedAt: new Date().toISOString(), notes: completionNote || null }
            : woa
        );
        return { ...prev, workOrderAssets: updatedAssets };
      });
      setCompleteDialogOpen(false);
      setCompletionNote("");
    } catch (error) {
      console.error(error);
      toast.error(t("completeAllError"));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }
  if (!workOrder) return null;

  const hasAssets = workOrder.workOrderAssets.length > 0;
  const pendingAssetsCount = workOrder.workOrderAssets.filter((woa) => !woa.completedAt).length;

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Wrench className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {workOrder.title}
              </h1>
              <span className="text-sm font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                {workOrder.code || workOrder.id.slice(-6)}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {t("workOrder")}
              </span>
              {workOrder.status && (
                <Badge
                  style={{
                    backgroundColor: `${getStatusColor(workOrder.status.color)}20`,
                    color: getStatusColor(workOrder.status.color),
                  }}
                  className="border-0 text-sm font-semibold px-3 py-1"
                >
                  {isRtl ? workOrder.status.name : workOrder.status.nameEn || workOrder.status.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/${locale}/work-orders`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 transition-all duration-200"
        >
          {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {isRtl ? "العودة إلى القائمة" : "Back to list"}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الرئيسي (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* بطاقة التفاصيل */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("details")}</h2>
            </div>

            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <Tag className="h-3.5 w-3.5" />
                    {t("type")}
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {getTypeLabel(workOrder.type)}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {t("priority")}
                  </div>
                  {workOrder.priority && (
                    <Badge
                      style={{
                        backgroundColor: `${getStatusColor(workOrder.priority.color)}20`,
                        color: getStatusColor(workOrder.priority.color),
                        boxShadow: `0 0 15px ${getStatusColor(workOrder.priority.color)}25`,
                      }}
                      className="border-0 text-sm font-semibold px-4 py-1.5"
                    >
                      {isRtl ? workOrder.priority.name : workOrder.priority.nameEn || workOrder.priority.name}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <Package className="h-3.5 w-3.5" />
                    {t("assetType")}
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {workOrder.assetType
                      ? isRtl
                        ? workOrder.assetType.name
                        : workOrder.assetType.nameEn || workOrder.assetType.name
                      : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <FileText className="h-3.5 w-3.5" />
                    {t("status")}
                  </div>
                  {workOrder.status && (
                    <Badge
                      style={{
                        backgroundColor: `${getStatusColor(workOrder.status.color)}20`,
                        color: getStatusColor(workOrder.status.color),
                      }}
                      className="border-0 text-sm font-semibold px-4 py-1.5"
                    >
                      {isRtl ? workOrder.status.name : workOrder.status.nameEn || workOrder.status.name}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  <FileText className="h-3.5 w-3.5" />
                  {t("description")}
                </div>
                <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {workOrder.description || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* الأصول المرتبطة */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("assets")}</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                {workOrder.workOrderAssets.length}
              </span>
            </div>

            {hasAssets ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {t("assetsCount", { count: workOrder.workOrderAssets.length })}
                    {pendingAssetsCount > 0 && (
                      <span className="text-amber-500 dark:text-amber-400 ml-2 font-medium">
                        ({t("pendingCount", { count: pendingAssetsCount })})
                      </span>
                    )}
                  </span>
                  {pendingAssetsCount > 0 && (
                    <Button
                      onClick={() => {
                        setSelectedAsset(null);
                        setCompleteDialogOpen(true);
                      }}
                      size="sm"
                      className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
                      disabled={actionLoading}
                    >
                      <Check className="h-4 w-4 mr-1.5" />
                      {t("completeAll")}
                    </Button>
                  )}
                </div>

                <div className="border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableRow>
                        <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">
                          {t("assetName")}
                        </TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">
                          {t("assetCode")}
                        </TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">
                          {t("completionStatus")}
                        </TableHead>
                        <TableHead className="w-24 text-slate-600 dark:text-slate-300 font-semibold">
                          {t("actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workOrder.workOrderAssets.map((woa) => {
                        const asset = woa.asset;
                        const isCompleted = !!woa.completedAt;
                        return (
                          <TableRow
                            key={woa.assetId}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                          >
                            <TableCell className="font-medium text-slate-800 dark:text-slate-100">
                              {isRtl ? asset.name : asset.nameEn || asset.name}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                              {asset.code}
                            </TableCell>
                            <TableCell>
                              {isCompleted ? (
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="text-sm font-medium">{formatDate(woa.completedAt!)}</span>
                                </div>
                              ) : (
                                <span className="text-amber-500 dark:text-amber-400 font-medium">
                                  {t("pending")}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {!isCompleted && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAsset(woa);
                                    setCompletionNote("");
                                    setCompleteDialogOpen(true);
                                  }}
                                  disabled={actionLoading}
                                  className="rounded-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 text-center py-6">{t("noAssets")}</p>
            )}
          </div>

          {/* قطع الغيار */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("spareParts")}</h2>
            </div>
            <WorkOrderInventory workOrderId={workOrder.id} locale={locale} />
          </div>

          {/* مرفقات PDF */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "مرفقات PDF" : "PDF Attachments"}
              </h2>
            </div>
            <AttachmentsManager workOrderId={workOrder.id} canUpload={canEdit} canDelete={canEdit} maxFiles={5} />
          </div>

          {/* الموقع */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("location")}</h2>
            </div>
            {workOrder.room ? (
              <div className="space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {isRtl ? workOrder.room.name : workOrder.room.nameEn || workOrder.room.name}
                </p>
                {workOrder.room.floor && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isRtl ? workOrder.room.floor.name : workOrder.room.floor.nameEn || workOrder.room.floor.name}
                    {workOrder.room.floor.building && (
                      <>
                        {" "}
                        •{" "}
                        {isRtl
                          ? workOrder.room.floor.building.name
                          : workOrder.room.floor.building.nameEn || workOrder.room.floor.building.name}
                      </>
                    )}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-400 dark:text-slate-500">{t("noLocation")}</p>
            )}
          </div>

          {/* ملاحظات */}
          {workOrder.notes && (
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                  <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("notes")}</h2>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {workOrder.notes}
              </div>
            </div>
          )}

          {/* صور التذكرة */}
          {workOrder.ticketId && (
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40">
                  <FileText className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("attachedImages")}</h2>
              </div>
              {loadingAttachments ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500 dark:text-indigo-400" />
                </div>
              ) : attachments.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500 text-center py-6">{t("noImages")}</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                    >
                      <img
                        src={att.url}
                        alt={att.originalName || "Attachment"}
                        className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* العمود الجانبي (1/3) */}
        <div className="space-y-6">
          {/* التواريخ */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("dates")}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("createdAt")}
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(workOrder.createdAt)}</p>
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("updatedAt")}
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(workOrder.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* الفرع */}
          {workOrder.branch && (
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                  <Building className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("branch")}</h3>
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? workOrder.branch.name : workOrder.branch.nameEn || workOrder.branch.name}
              </p>
            </div>
          )}

          {/* مساعدة سريعة */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
            <Shield className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              {isRtl
                ? "يمكنك إكمال الأصول الفردية أو جميعها دفعة واحدة مع إضافة ملاحظات."
                : "You can complete individual assets or all at once with notes."}
            </div>
          </div>

          {/* زر العودة */}
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/work-orders`)}
            className="w-full rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium h-11 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToList")}
          </Button>
        </div>
      </div>

      {/* حوار إكمال الأصل */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 dark:text-slate-100 text-xl font-bold">
              {selectedAsset ? t("completeAssetTitle") : t("completeAllTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
              {selectedAsset
                ? t("completeAssetDescription", {
                    name: isRtl ? selectedAsset.asset.name : selectedAsset.asset.nameEn || selectedAsset.asset.name,
                  })
                : t("completeAllDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder={t("completionNotePlaceholder")}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]"
            />
          </div>
          <AlertDialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCompleteDialogOpen(false)}
              className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={selectedAsset ? handleCompleteAsset : handleCompleteAll}
              disabled={actionLoading}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}