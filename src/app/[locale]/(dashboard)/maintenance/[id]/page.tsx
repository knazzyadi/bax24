"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Calendar, Clock, Building, Tag, FileText, Loader2, Play, ArrowLeft,
  CheckCircle2, XCircle, Info, MapPin, Layers, DoorOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { addDays, addMonths, addYears, format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { SidebarCard } from "@/components/shared/detail/SidebarCard";

interface ScheduleDetail {
  id: string;
  name: string;
  frequency: string;
  leadDays: number;
  startDate: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  branch: { id: string; name: string; nameEn?: string } | null;
  building: { id: string; name: string; nameEn?: string } | null;
  assetType: { id: string; name: string; nameEn?: string } | null;
  scheduleAssets: { asset: { id: string; name: string; code: string; nameEn?: string } }[];
}

const FREQUENCY_MAP: Record<string, { ar: string; en: string }> = {
  DAILY: { ar: "يومي", en: "Daily" },
  WEEKLY: { ar: "أسبوعي", en: "Weekly" },
  MONTHLY: { ar: "شهري", en: "Monthly" },
  YEARLY: { ar: "سنوي", en: "Yearly" },
};

export default function MaintenanceScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const id = params.id as string;
  const t = useTranslations("MaintenanceForm");
  const isRtl = locale === "ar";

  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch(`/api/maintenance/schedules/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSchedule(data);
      } catch (error) {
        console.error(error);
        toast.error(t("fetchError"));
        router.push(`/${locale}/maintenance`);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSchedule();
  }, [id, locale, router, t]);

  const handleRun = async () => {
    setExecuting(true);
    toast.loading(isRtl ? "جاري تنفيذ الجدول..." : "Executing schedule...");
    try {
      const res = await fetch(`/api/maintenance/schedules/${id}/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.dismiss();
      toast.success(data.message || (isRtl ? "تم تنفيذ الجدول بنجاح" : "Schedule executed successfully"));
      router.refresh();
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || (isRtl ? "فشل التنفيذ" : "Execution failed"));
    } finally {
      setExecuting(false);
    }
  };

  const getNextDueDate = (): Date | null => {
    if (!schedule) return null;
    const lastRun = schedule.lastRunAt ? new Date(schedule.lastRunAt) : null;
    const start = schedule.startDate ? new Date(schedule.startDate) : null;
    const createdAt = new Date(schedule.createdAt);
    const reference = lastRun || start || createdAt;
    switch (schedule.frequency) {
      case "DAILY": return addDays(reference, 1);
      case "WEEKLY": return addDays(reference, 7);
      case "MONTHLY": return addMonths(reference, 1);
      case "YEARLY": return addYears(reference, 1);
      default: return addDays(reference, 30);
    }
  };

  const formatLocalDate = (date: Date | string | null) => {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    const localeObj = locale === "ar" ? arSA : enUS;
    return format(d, "PPP", { locale: localeObj });
  };

  const getFrequencyLabel = () => {
    if (!schedule) return "";
    const label = FREQUENCY_MAP[schedule.frequency];
    return label ? (isRtl ? label.ar : label.en) : schedule.frequency;
  };

  const getLocationName = () => {
    if (!schedule) return "";
    if (schedule.building) return isRtl ? schedule.building.name : (schedule.building.nameEn || schedule.building.name);
    if (schedule.branch) return isRtl ? schedule.branch.name : (schedule.branch.nameEn || schedule.branch.name);
    return isRtl ? "جميع المواقع" : "All locations";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!schedule) return null;

  const nextDue = getNextDueDate();

  return (
    <PageContainer>
      <DetailHeader
        icon={<Calendar size={28} />}
        title={schedule.name}
        subtitle={`${t("schedule")} ${schedule.id.slice(-6)}`}
        actions={null}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الرئيسي - المعلومات */}
        <div className="lg:col-span-2 space-y-8">
          <InfoCard title={t("basicInfo")} icon={<FileText className="h-5 w-5" />}>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase">{t("frequency")}</div>
                <p className="font-bold flex items-center gap-2"><Clock size={14} /> {getFrequencyLabel()}</p>
              </div>
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase">{t("leadDays")}</div>
                <p className="font-bold">{schedule.leadDays} {isRtl ? "يوم" : "days"}</p>
              </div>
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase">{t("status")}</div>
                {schedule.isActive ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 size={12} className="mr-1" /> {isRtl ? "نشط" : "Active"}</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700"><XCircle size={12} className="mr-1" /> {isRtl ? "غير نشط" : "Inactive"}</Badge>
                )}
              </div>
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase">{t("location")}</div>
                <p className="font-bold flex items-center gap-2"><Building size={14} /> {getLocationName()}</p>
              </div>
              {schedule.startDate && (
                <div>
                  <div className="text-xs font-black text-muted-foreground uppercase">{t("startDate")}</div>
                  <p className="font-bold">{formatLocalDate(schedule.startDate)}</p>
                </div>
              )}
              {schedule.assetType && (
                <div>
                  <div className="text-xs font-black text-muted-foreground uppercase">{t("assetType")}</div>
                  <p className="font-bold flex items-center gap-2"><Tag size={14} /> {isRtl ? schedule.assetType.name : (schedule.assetType.nameEn || schedule.assetType.name)}</p>
                </div>
              )}
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase">{t("createdAt")}</div>
                <p className="font-mono text-sm">{formatLocalDate(schedule.createdAt)}</p>
              </div>
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase">{t("updatedAt")}</div>
                <p className="font-mono text-sm">{formatLocalDate(schedule.updatedAt)}</p>
              </div>
            </div>
          </InfoCard>

          <InfoCard title={t("executionInfo")} icon={<Clock className="h-5 w-5" />}>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("lastRun")}</span>
                <span className="font-mono">{schedule.lastRunAt ? formatLocalDate(schedule.lastRunAt) : t("never")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("nextDue")}</span>
                <span className="font-mono font-bold text-primary">{nextDue ? formatLocalDate(nextDue) : t("notCalculated")}</span>
              </div>
            </div>
          </InfoCard>

          {schedule.scheduleAssets && schedule.scheduleAssets.length > 0 && (
            <InfoCard title={t("specificAssets")} icon={<Tag className="h-5 w-5" />}>
              <div className="space-y-2">
                {schedule.scheduleAssets.map((sa) => (
                  <div key={sa.asset.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/20">
                    <div>
                      <p className="font-bold">{isRtl ? sa.asset.name : (sa.asset.nameEn || sa.asset.name)}</p>
                      <p className="text-xs text-muted-foreground font-mono">{sa.asset.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}
        </div>

        {/* العمود الجانبي - الأيمن (الملاحظات الإضافية الآن في الأعلى) */}
        <div className="space-y-8">
          {/* ✅ الملاحظات الإضافية - نقلت إلى اليمين فوق الإجراءات */}
          <SidebarCard title={t("notes")} icon={<FileText className="h-5 w-5" />}>
            <p className="whitespace-pre-wrap">
              {schedule.notes || (isRtl ? "لا توجد ملاحظات إضافية" : "No additional notes")}
            </p>
          </SidebarCard>

          {/* حاوية الإجراءات (زر التشغيل) */}
          <SidebarCard title={t("actions")} icon={<Play className="h-5 w-5" />}>
            <div className="space-y-4">
              <Button
                onClick={handleRun}
                disabled={executing || !schedule.isActive}
                className="w-full rounded-full bg-primary hover:bg-primary/90 font-black gap-2"
              >
                {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play size={16} />}
                {t("runNow")}
              </Button>
              {!schedule.isActive && (
                <p className="text-xs text-muted-foreground text-center">{t("inactiveHint")}</p>
              )}
            </div>
          </SidebarCard>

          {/* زر العودة */}
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/maintenance`)}
              className="w-full rounded-full border-primary text-primary hover:bg-primary/10 font-black h-11 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToList")}
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}