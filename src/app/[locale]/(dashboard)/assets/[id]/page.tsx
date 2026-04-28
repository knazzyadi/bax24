// src/app/[locale]/(dashboard)/assets/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import {
  Calendar, MapPin, FileText, Loader2, ShieldCheck, Info,
  Wrench, Package, AlertCircle, CheckCircle2, Clock, History
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { SidebarCard } from "@/components/shared/detail/SidebarCard";
import { toast } from "sonner";

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
  type?: { id: string; name: string; nameEn?: string };
  status?: { id: string; name: string; nameEn?: string; color?: string };
  purchaseDate?: string;
  warrantyEnd?: string;
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
      }
    }
  };
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const assetId = params.id as string;
  const t = useTranslations('Assets');
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
          fetch(`/api/assets/${assetId}/maintenance-history`) // قد تحتاج إلى إنشاء هذا الـ API
        ]);

        if (!assetRes.ok) {
          if (assetRes.status === 404) throw new Error(t('assetNotFound'));
          throw new Error(t('fetchError'));
        }
        const assetData = await assetRes.json();
        setAsset(assetData);

        if (workOrdersRes.ok) {
          const data = await workOrdersRes.json();
          setWorkOrders(Array.isArray(data) ? data : (data.workOrders || []));
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
        setError(err.message || t('fetchError'));
        toast.error(err.message || t('fetchError'));
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
      parts.push(isRtl ? room.floor.building.name : (room.floor.building.nameEn || room.floor.building.name));
    }
    if (room.floor) {
      parts.push(isRtl ? room.floor.name : (room.floor.nameEn || room.floor.name));
    }
    parts.push(isRtl ? room.name : (room.nameEn || room.name));
    return parts.join(" - ");
  };

  const getStatusBadge = (status?: AssetDetail['status']) => {
    if (!status) return <Badge variant="secondary">—</Badge>;
    const name = isRtl ? status.name : (status.nameEn || status.name);
    let color = status.color || "#6b7280";
    let bg = `${color}20`;
    return (
      <Badge style={{ backgroundColor: bg, color: color }} className="border-0">
        {name}
      </Badge>
    );
  };

  const getWorkOrderStatusBadge = (status: WorkOrder['status']) => {
    if (!status) return <Badge variant="secondary">—</Badge>;
    const name = isRtl ? status.name : (status.nameEn || status.name);
    let color = status.color || "#6b7280";
    return (
      <Badge style={{ backgroundColor: `${color}20`, color: color }} className="border-0">
        {name}
      </Badge>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">{error || t('assetNotFound')}</p>
          <Button onClick={() => router.push(`/${locale}/assets`)} className="mt-4">
            {isRtl ? "العودة إلى الأصول" : "Back to Assets"}
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <DetailHeader
        icon={<Package size={28} />}
        title={isRtl ? asset.name : (asset.nameEn || asset.name)}
        subtitle={`${t('code')}: ${asset.code}`}
        actions={null}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الأيسر - المعلومات الأساسية والملاحظات وأوامر العمل المرتبطة */}
        <div className="lg:col-span-2 space-y-8">
          <InfoCard title={t('basicInfo')} icon={<FileText className="h-5 w-5" />}>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-muted-foreground text-sm">{t('name')}</Label>
                <p className="font-bold text-lg">{asset.name}</p>
                {asset.nameEn && (
                  <>
                    <Label className="text-muted-foreground text-sm mt-2">{t('nameEn')}</Label>
                    <p className="font-bold">{asset.nameEn}</p>
                  </>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">{t('code')}</Label>
                <p className="font-mono font-bold text-lg">{asset.code}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">{t('type')}</Label>
                <p>{asset.type ? (isRtl ? asset.type.name : (asset.type.nameEn || asset.type.name)) : "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">{t('status')}</Label>
                <div>{getStatusBadge(asset.status)}</div>
              </div>
            </div>
          </InfoCard>

          {asset.notes && (
            <InfoCard title={t('notes')} icon={<Info className="h-5 w-5" />}>
              <p className="whitespace-pre-wrap">{asset.notes}</p>
            </InfoCard>
          )}

          {/* أوامر العمل المرتبطة (تبقى في اليسار) */}
          <SidebarCard title={isRtl ? "أوامر العمل المرتبطة" : "Related Work Orders"} icon={<Wrench className="h-5 w-5" />}>
            {workOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">{isRtl ? "لا توجد أوامر عمل لهذا الأصل" : "No work orders for this asset"}</p>
            ) : (
              <div className="space-y-4">
                {workOrders.map((wo) => (
                  <div key={wo.id} className="border-b border-border pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <Link href={`/${locale}/work-orders/${wo.id}`} className="font-bold hover:underline">
                        {wo.title}
                      </Link>
                      {getWorkOrderStatusBadge(wo.status)}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(wo.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {isRtl ? (wo.priority?.name || '—') : (wo.priority?.nameEn || wo.priority?.name || '—')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SidebarCard>

          {/* سجل الصيانة (صيانات سابقة) - يمكن إضافة مزيد من التفاصيل لاحقاً */}
          <SidebarCard title={isRtl ? "سجل الصيانة" : "Maintenance History"} icon={<History className="h-5 w-5" />}>
            {maintenanceHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">{isRtl ? "لا توجد صيانات مسجلة" : "No maintenance records"}</p>
            ) : (
              <div className="space-y-3">
                {maintenanceHistory.map((record) => (
                  <div key={record.id} className="border-b border-border pb-2 last:border-0">
                    <p className="font-semibold">{record.scheduleName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(record.executedAt)}</p>
                    {record.workOrderCode && <p className="text-xs font-mono">{record.workOrderCode}</p>}
                    {record.notes && <p className="text-xs">{record.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </SidebarCard>
        </div>

        {/* العمود الأيمن - الموقع، دورة الحياة، الأزرار */}
        <div className="space-y-8">
          <SidebarCard title={t('location')} icon={<MapPin className="h-5 w-5" />}>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{getFullLocation(asset)}</span>
            </div>
          </SidebarCard>

          <SidebarCard title={t('lifecycle')} icon={<ShieldCheck className="h-5 w-5 text-emerald-500/70" />}>
            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground text-sm">{t('purchaseDate')}</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(asset.purchaseDate)}</span>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">{t('warrantyEnd')}</Label>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>{formatDate(asset.warrantyEnd)}</span>
                </div>
              </div>
            </div>
          </SidebarCard>

          {/* زر العودة */}
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full rounded-full border-primary text-primary hover:bg-primary/10 font-black h-11"
            >
              {t("back") || (isRtl ? "عودة" : "Back")}
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium text-muted-foreground mb-1 ${className || ''}`}>{children}</div>;
}