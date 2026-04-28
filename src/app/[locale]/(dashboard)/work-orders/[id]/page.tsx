// src/app/[locale]/(dashboard)/work-orders/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  FileText, Calendar, MapPin, Building, Package, AlertCircle,
  CheckCircle2, Clock, Loader2, Wrench, ArrowLeft, Check,
  X, Tag, User, Phone, Mail, Layers, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { SidebarCard } from "@/components/shared/detail/SidebarCard";
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

interface WorkOrderAsset {
  id?: string; // معرف السجل في WorkOrderAsset
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

  // جلب البيانات
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

  // تنسيق التاريخ حسب اللغة
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const localeObj = locale === "ar" ? arSA : enUS;
    return format(date, "PPP", { locale: localeObj });
  };

  // الحصول على تسمية نوع الطلب
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "MAINTENANCE": return t("type_maintenance");
      case "CORRECTIVE": return t("type_corrective");
      case "EMERGENCY": return t("type_emergency");
      case "BULK_PREVENTIVE": return t("type_bulk_preventive");
      default: return type;
    }
  };

  // الحصول على لون الخلفية للحالة أو الأولوية
  const getStatusColor = (color?: string) => {
    if (color) return color;
    return "#6b7280";
  };

  // تسجيل إنجاز أصل فردي
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
      // تحديث البيانات المحلية
      setWorkOrder(prev => {
        if (!prev) return prev;
        const updatedAssets = prev.workOrderAssets.map(woa =>
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

  // إنجاز جميع الأصول غير المكتملة دفعة واحدة
  const handleCompleteAll = async () => {
    const pendingAssets = workOrder?.workOrderAssets.filter(woa => !woa.completedAt) || [];
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
      // تحديث جميع الأصول
      setWorkOrder(prev => {
        if (!prev) return prev;
        const updatedAssets = prev.workOrderAssets.map(woa =>
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
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!workOrder) return null;

  const isPending = workOrder.status?.name !== "COMPLETED"; // حسب تعريف الحالة
  const hasAssets = workOrder.workOrderAssets.length > 0;
  const pendingAssetsCount = workOrder.workOrderAssets.filter(woa => !woa.completedAt).length;

  return (
    <PageContainer>
      <DetailHeader
        icon={<Wrench size={28} />}
        title={`${t("workOrder")} ${workOrder.code}`}
        subtitle={workOrder.title}
        actions={
          <Link
            href={`/${locale}/work-orders`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-md border border-border hover:bg-secondary transition-all duration-200 hover:scale-105"
            aria-label={isRtl ? "العودة إلى القائمة" : "Back to list"}
          >
            {isRtl ? <ChevronLeft className="h-5 w-5 text-primary" /> : <ArrowLeft className="h-5 w-5 text-primary" />}
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الرئيسي */}
        <div className="lg:col-span-2 space-y-8">
          <InfoCard title={t("details")} icon={<FileText className="h-5 w-5" />}>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-black text-muted-foreground">{t("type")}</div>
                  <p className="font-bold">{getTypeLabel(workOrder.type)}</p>
                </div>
                <div>
                  <div className="text-xs font-black text-muted-foreground">{t("status")}</div>
                  {workOrder.status && (
                    <Badge
                      style={{ backgroundColor: `${getStatusColor(workOrder.status.color)}20`, color: getStatusColor(workOrder.status.color) }}
                      className="border-0"
                    >
                      {isRtl ? workOrder.status.name : (workOrder.status.nameEn || workOrder.status.name)}
                    </Badge>
                  )}
                </div>
                <div>
                  <div className="text-xs font-black text-muted-foreground">{t("priority")}</div>
                  {workOrder.priority && (
                    <Badge
                      style={{ backgroundColor: `${getStatusColor(workOrder.priority.color)}20`, color: getStatusColor(workOrder.priority.color) }}
                      className="border-0"
                    >
                      {isRtl ? workOrder.priority.name : (workOrder.priority.nameEn || workOrder.priority.name)}
                    </Badge>
                  )}
                </div>
                <div>
                  <div className="text-xs font-black text-muted-foreground">{t("assetType")}</div>
                  <p>{workOrder.assetType ? (isRtl ? workOrder.assetType.name : (workOrder.assetType.nameEn || workOrder.assetType.name)) : "—"}</p>
                </div>
              </div>
              <div>
                <div className="text-xs font-black text-muted-foreground">{t("description")}</div>
                <p className="whitespace-pre-wrap text-foreground/80">{workOrder.description || "—"}</p>
              </div>
            </div>
          </InfoCard>

          {/* الأصول المرتبطة (جدول) */}
          <InfoCard title={t("assets")} icon={<Package className="h-5 w-5" />}>
            {hasAssets ? (
              <>
                {/* ملخص وزر إنجاز الكل */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm">
                    {t("assetsCount", { count: workOrder.workOrderAssets.length })}
                    {pendingAssetsCount > 0 && (
                      <span className="text-muted-foreground ml-2">
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
                      className="rounded-full"
                      disabled={actionLoading}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {t("completeAll")}
                    </Button>
                  )}
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>{t("assetName")}</TableHead>
                        <TableHead>{t("assetCode")}</TableHead>
                        <TableHead>{t("completionStatus")}</TableHead>
                        <TableHead className="w-24">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workOrder.workOrderAssets.map(woa => {
                        const asset = woa.asset;
                        const isCompleted = !!woa.completedAt;
                        return (
                          <TableRow key={woa.assetId}>
                            <TableCell className="font-medium">
                              {isRtl ? asset.name : (asset.nameEn || asset.name)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{asset.code}</TableCell>
                            <TableCell>
                              {isCompleted ? (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>{formatDate(woa.completedAt!)}</span>
                                </div>
                              ) : (
                                <span className="text-amber-500">{t("pending")}</span>
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
              <p className="text-muted-foreground">{t("noAssets")}</p>
            )}
          </InfoCard>

          <InfoCard title={t("location")} icon={<MapPin className="h-5 w-5" />}>
            {workOrder.room ? (
              <div>
                <p className="font-bold">
                  {isRtl ? workOrder.room.name : (workOrder.room.nameEn || workOrder.room.name)}
                </p>
                {workOrder.room.floor && (
                  <p className="text-sm text-muted-foreground">
                    {isRtl ? workOrder.room.floor.name : (workOrder.room.floor.nameEn || workOrder.room.floor.name)}
                    {workOrder.room.floor.building && (
                      <> • {isRtl ? workOrder.room.floor.building.name : (workOrder.room.floor.building.nameEn || workOrder.room.floor.building.name)}</>
                    )}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">{t("noLocation")}</p>
            )}
          </InfoCard>

          {workOrder.notes && (
            <InfoCard title={t("notes")} icon={<FileText className="h-5 w-5" />}>
              <p className="whitespace-pre-wrap">{workOrder.notes}</p>
            </InfoCard>
          )}
        </div>

        {/* العمود الجانبي */}
        <div className="space-y-8">
          <SidebarCard title={t("dates")} icon={<Calendar className="h-5 w-5" />}>
            <div className="space-y-2">
              <div>
                <div className="text-xs font-bold text-muted-foreground">{t("createdAt")}</div>
                <p className="font-medium">{formatDate(workOrder.createdAt)}</p>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground">{t("updatedAt")}</div>
                <p className="font-medium">{formatDate(workOrder.updatedAt)}</p>
              </div>
            </div>
          </SidebarCard>

          {workOrder.branch && (
            <SidebarCard title={t("branch")} icon={<Building className="h-5 w-5" />}>
              <p className="font-bold">{isRtl ? workOrder.branch.name : (workOrder.branch.nameEn || workOrder.branch.name)}</p>
            </SidebarCard>
          )}

          {/* زر العودة */}
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/work-orders`)}
              className="w-full rounded-full border-primary text-primary hover:bg-primary/10 font-black h-11"
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              {t("backToList")}
            </Button>
          </div>
        </div>
      </div>

      {/* حوار تأكيد إكمال الأصل/جميع الأصول */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl p-0 max-w-md w-[95%] overflow-hidden shadow-lg bg-card border border-border" dir={isRtl ? "rtl" : "ltr"}>
          <div className="p-5 border-b border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground text-xl font-black">
                {selectedAsset ? t("completeAssetTitle") : t("completeAllTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground font-medium text-sm">
                {selectedAsset
                  ? t("completeAssetDescription", { name: isRtl ? selectedAsset.asset.name : (selectedAsset.asset.nameEn || selectedAsset.asset.name) })
                  : t("completeAllDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <div className="p-5">
            <Textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder={t("completionNotePlaceholder")}
              className="rounded-xl bg-background border-border min-h-[100px] font-medium"
            />
          </div>
          <AlertDialogFooter className="flex flex-row gap-3 p-5 pt-0">
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)} className="flex-1 rounded-full font-bold h-11">
              {t("cancel")}
            </Button>
            <Button
              onClick={selectedAsset ? handleCompleteAsset : handleCompleteAll}
              disabled={actionLoading}
              className="flex-1 rounded-full bg-primary hover:bg-primary/90 font-bold h-11"
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}