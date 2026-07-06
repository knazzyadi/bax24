// src/app/[locale]/(dashboard)/assets/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Calendar,
  MapPin,
  FileText,
  Loader2,
  ShieldCheck,
  Info,
  Wrench,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { SidebarCard } from "@/components/shared/detail/SidebarCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WorkOrder {
  id: string;
  title: string;
  type: string;
  status: { id: string; name: string; nameEn?: string; color?: string };
  priority: { id: string; name: string; nameEn?: string };
  createdAt: string;
}

interface MaintenanceRecord {
  id: string;
  scheduleName: string;
  executedAt: string;
  workOrderCode: string;
  notes?: string;
}

interface AssetDetail {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  type?: { id: string; name: string; nameEn?: string };
  status?: { id: string; name: string; nameEn?: string; color?: string };
  purchaseDate?: string;
  warrantyEnd?: string;
  lastMaintenanceDate?: string;
  notes?: string;
  room?: {
    id: string;
    name: string;
    nameEn?: string;
    code?: string;
    floor?: {
      id: string;
      name: string;
      nameEn?: string;
      building?: {
        id: string;
        name: string;
        nameEn?: string;
      };
    };
  };
}

// كرت الخلفية الزجاجي
const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const assetId = params.id as string;
  const t = useTranslations("Assets");
  const isRtl = locale === "ar";

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!assetId) return;
      try {
        const [assetRes, workOrdersRes, maintenanceRes] = await Promise.all([
          fetch(`/api/assets/${assetId}`),
          fetch(`/api/work-orders?assetId=${assetId}`),
          fetch(`/api/assets/${assetId}/maintenance-history`),
        ]);

        if (!assetRes.ok) {
          if (assetRes.status === 404) throw new Error(t("assetNotFound"));
          throw new Error(t("fetchError"));
        }
        const assetData = await assetRes.json();
        setAsset(assetData);

        if (workOrdersRes.ok) {
          const data = await workOrdersRes.json();
          setWorkOrders(Array.isArray(data) ? data : data.workOrders || []);
        } else {
          setWorkOrders([]);
        }

        if (maintenanceRes.ok) {
          const historyData = await maintenanceRes.json();
          setMaintenanceHistory(historyData);
        } else {
          setMaintenanceHistory([]);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || t("fetchError"));
        toast.error(err.message || t("fetchError"));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [assetId, t]);

  const getFullLocation = (asset: AssetDetail): string => {
    const room = asset.room;
    if (!room) return isRtl ? "موقع غير محدد" : "Location not set";
    const parts = [];
    if (room.floor?.building) {
      parts.push(
        isRtl
          ? room.floor.building.name
          : room.floor.building.nameEn || room.floor.building.name
      );
    }
    if (room.floor) {
      parts.push(
        isRtl ? room.floor.name : room.floor.nameEn || room.floor.name
      );
    }
    parts.push(isRtl ? room.name : room.nameEn || room.name);
    return parts.join(" - ");
  };

  const getStatusBadge = (status?: AssetDetail["status"]) => {
    if (!status) return <Badge variant="secondary">—</Badge>;
    const name = isRtl ? status.name : status.nameEn || status.name;
    const color = status.color || "#6b7280";
    return (
      <Badge
        style={{ backgroundColor: `${color}20`, color }}
        className="border-0 font-semibold px-3 py-1"
      >
        {name}
      </Badge>
    );
  };

  const getWorkOrderStatusBadge = (status: WorkOrder["status"]) => {
    if (!status) return <Badge variant="secondary">—</Badge>;
    const name = isRtl ? status.name : status.nameEn || status.name;
    const color = status.color || "#6b7280";
    return (
      <Badge
        style={{ backgroundColor: `${color}20`, color }}
        className="border-0 font-semibold px-3 py-1"
      >
        {name}
      </Badge>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(isRtl ? "ar-SA" : "en-US");
  };

  if (loading) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="relative p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">{error || t("assetNotFound")}</p>
          <Button
            onClick={() => router.push(`/${locale}/assets`)}
            className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20"
          >
            {isRtl ? "العودة إلى الأصول" : "Back to Assets"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {isRtl ? asset.name : asset.nameEn || asset.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isRtl ? "الكود" : "Code"}: {asset.code}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          {t("back")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الرئيسي (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* المعلومات الأساسية */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("basicInfo")}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* الاسم العربي */}
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("name")}
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {asset.name}
                </p>
              </div>

              {/* الاسم الإنجليزي */}
              {asset.nameEn && (
                <div className="space-y-1">
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {t("nameEn")}
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {asset.nameEn}
                  </p>
                </div>
              )}

              {/* الكود */}
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("code")}
                </div>
                <p className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                  {asset.code}
                </p>
              </div>

              {/* النوع */}
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("type")}
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {asset.type
                    ? isRtl
                      ? asset.type.name
                      : asset.type.nameEn || asset.type.name
                    : "—"}
                </p>
              </div>

              {/* الحالة */}
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("status")}
                </div>
                <div>{getStatusBadge(asset.status)}</div>
              </div>

              {/* الوصف العربي */}
              {asset.description && (
                <div className="sm:col-span-2 space-y-1">
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {isRtl ? "الوصف (عربي)" : "Description (Arabic)"}
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {asset.description}
                  </div>
                </div>
              )}

              {/* الوصف الإنجليزي */}
              {asset.descriptionEn && (
                <div className="sm:col-span-2 space-y-1">
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {isRtl ? "الوصف (English)" : "Description (English)"}
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {asset.descriptionEn}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* الملاحظات */}
          {asset.notes && (
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                  <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("notes")}
                </h2>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {asset.notes}
              </div>
            </div>
          )}

          {/* أوامر العمل المرتبطة */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "أوامر العمل المرتبطة" : "Related Work Orders"}
              </h2>
            </div>
            {workOrders.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-center py-6">
                {isRtl ? "لا توجد أوامر عمل لهذا الأصل" : "No work orders for this asset"}
              </p>
            ) : (
              <div className="space-y-4">
                {workOrders.map((wo) => (
                  <div
                    key={wo.id}
                    className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Link
                        href={`/${locale}/work-orders/${wo.id}`}
                        className="font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {wo.title}
                      </Link>
                      {getWorkOrderStatusBadge(wo.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(wo.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {isRtl
                          ? wo.priority?.name || "—"
                          : wo.priority?.nameEn || wo.priority?.name || "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* سجل الصيانة */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40">
                <History className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "سجل الصيانة" : "Maintenance History"}
              </h2>
            </div>
            {maintenanceHistory.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-center py-6">
                {isRtl ? "لا توجد صيانات مسجلة" : "No maintenance records"}
              </p>
            ) : (
              <div className="space-y-4">
                {maintenanceHistory.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30"
                  >
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {record.scheduleName}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(record.executedAt)}
                      </span>
                      {record.workOrderCode && (
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">
                          {record.workOrderCode}
                        </span>
                      )}
                    </div>
                    {record.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {record.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* العمود الجانبي (1/3) */}
        <div className="space-y-6">
          {/* الموقع */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("location")}
              </h3>
            </div>
            <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-400" />
              {getFullLocation(asset)}
            </p>
          </div>

          {/* دورة الحياة */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("lifecycle")}
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("purchaseDate")}
                </div>
                <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {formatDate(asset.purchaseDate)}
                </p>
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("warrantyEnd")}
                </div>
                <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  {formatDate(asset.warrantyEnd)}
                </p>
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {isRtl ? "آخر صيانة" : "Last Maintenance"}
                </div>
                <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-slate-400" />
                  {asset.lastMaintenanceDate
                    ? formatDate(asset.lastMaintenanceDate)
                    : isRtl
                    ? "لا توجد"
                    : "None"}
                </p>
              </div>
            </div>
          </div>

          {/* زر العودة */}
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium h-11 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            {t("back")}
          </Button>
        </div>
      </div>
    </div>
  );
}