"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Calendar,
  Clock,
  Building,
  Tag,
  FileText,
  Loader2,
  Play,
  ArrowLeft,
  XCircle,
  MapPin,
  Shield,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

// استيراد دوال utils الجديدة
import { calculateNextDate } from "../utils";

// تعريف ScheduleDetail
interface ScheduleDetail {
  id: string;
  name: string;
  frequency: string;
  frequencyDays: number;
  leadDays: number;
  startDate: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  branch: { id: string; name: string; nameEn?: string } | null;
  building: { id: string; name: string; nameEn?: string } | null;
  floor: { id: string; name: string; nameEn?: string } | null;
  room: { id: string; name: string; nameEn?: string } | null;
  locationLevel: string | null;
  assetType: { id: string; name: string; nameEn?: string } | null;
  scheduleAssets: { asset: { id: string; name: string; code: string; nameEn?: string } }[];
}

// تكوين التردد (بما فيها CUSTOM)
import type { LucideIcon } from "lucide-react";
const FREQUENCY_MAP: Record<
  string,
  {
    ar: string;
    en: string;
    icon: LucideIcon;
    color: string;
  }
> = {
  MONTHLY: {
    ar: "شهري",
    en: "Monthly",
    icon: Calendar,
    color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
  },
  QUARTERLY: {
    ar: "ربع سنوي",
    en: "Quarterly",
    icon: Calendar,
    color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
  },
  SEMI_ANNUAL: {
    ar: "نصف سنوي",
    en: "Semi-annual",
    icon: Calendar,
    color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
  },
  YEARLY: {
    ar: "سنوي",
    en: "Yearly",
    icon: Calendar,
    color: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
  },
  CUSTOM: {
    ar: "مخصص",
    en: "Custom",
    icon: CalendarDays,
    color: "text-rose-500 bg-rose-50 dark:bg-rose-950/30",
  },
};

// المكون الرئيسي
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

  const glassCard =
    "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

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
      const res = await fetch(`/api/maintenance/schedules/${id}/run`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.dismiss();
      toast.success(
        data.message ||
          (isRtl
            ? "تم تنفيذ الجدول بنجاح"
            : "Schedule executed successfully")
      );
      router.refresh();
    } catch (error: unknown) {
      toast.dismiss();
      const message =
        error instanceof Error
          ? error.message
          : isRtl
            ? "فشل التنفيذ"
            : "Execution failed";
      toast.error(message);
    } finally {
      setExecuting(false);
    }
  };

  // ✅ استبدال getNextDueDate لاستخدام calculateNextDate من utils (بدون leadDays)
  const getNextDueDate = (): Date | null => {
    if (!schedule) return null;

    const referenceDate = schedule.lastRunAt
      ? new Date(schedule.lastRunAt)
      : schedule.startDate
        ? new Date(schedule.startDate)
        : new Date(schedule.createdAt);

    return calculateNextDate(
      referenceDate,
      schedule.frequency,
      schedule.frequencyDays
    );
  };

  const formatLocalDate = (date: Date | string | null) => {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    const localeObj = locale === "ar" ? arSA : enUS;
    return format(d, "PPP", { locale: localeObj });
  };

  const getFrequencyDisplay = () => {
    if (!schedule) return { label: "", icon: Calendar, color: "text-slate-500 bg-slate-50 dark:bg-slate-800/30" };
    const config = FREQUENCY_MAP[schedule.frequency];
    if (config) {
      return {
        label: isRtl ? config.ar : config.en,
        icon: config.icon,
        color: config.color,
      };
    }
    if (schedule.frequency === "DAILY") {
      return {
        label: isRtl ? "يومي" : "Daily",
        icon: Calendar,
        color: "text-slate-500 bg-slate-50 dark:bg-slate-800/30",
      };
    }
    if (schedule.frequency === "WEEKLY") {
      return {
        label: isRtl ? "أسبوعي" : "Weekly",
        icon: Calendar,
        color: "text-slate-500 bg-slate-50 dark:bg-slate-800/30",
      };
    }
    return {
      label: schedule.frequency,
      icon: Calendar,
      color: "text-slate-500 bg-slate-50 dark:bg-slate-800/30",
    };
  };

  const getLocationName = (): string => {
    if (!schedule) return "";
    const parts: string[] = [];
    if (schedule.locationLevel === "room" && schedule.room) {
      parts.push(isRtl ? schedule.room.name : schedule.room.nameEn || schedule.room.name);
      if (schedule.floor) {
        parts.push(isRtl ? schedule.floor.name : schedule.floor.nameEn || schedule.floor.name);
      }
      if (schedule.building) {
        parts.push(isRtl ? schedule.building.name : schedule.building.nameEn || schedule.building.name);
      }
      if (schedule.branch) {
        parts.push(isRtl ? schedule.branch.name : schedule.branch.nameEn || schedule.branch.name);
      }
      return parts.join(" - ");
    }
    if (schedule.locationLevel === "floor" && schedule.floor) {
      parts.push(isRtl ? schedule.floor.name : schedule.floor.nameEn || schedule.floor.name);
      if (schedule.building) {
        parts.push(isRtl ? schedule.building.name : schedule.building.nameEn || schedule.building.name);
      }
      if (schedule.branch) {
        parts.push(isRtl ? schedule.branch.name : schedule.branch.nameEn || schedule.branch.name);
      }
      return parts.join(" - ");
    }
    if (schedule.locationLevel === "building" && schedule.building) {
      parts.push(isRtl ? schedule.building.name : schedule.building.nameEn || schedule.building.name);
      if (schedule.branch) {
        parts.push(isRtl ? schedule.branch.name : schedule.branch.nameEn || schedule.branch.name);
      }
      return parts.join(" - ");
    }
    if (schedule.branch) {
      return isRtl ? schedule.branch.name : schedule.branch.nameEn || schedule.branch.name;
    }
    return isRtl ? "جميع المواقع" : "All locations";
  };

  if (loading) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }
  if (!schedule) return null;

  const freqDisplay = getFrequencyDisplay();
  const FreqIcon = freqDisplay.icon;
  const nextDue = getNextDueDate();
  const isOverdue = nextDue && nextDue < new Date() && schedule.isActive;

  return (
    <div className="relative space-y-8 p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Calendar className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {schedule.name}
              </h1>
              {schedule.isActive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-50/50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isRtl ? "نشط" : "Active"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                  <XCircle size={14} />
                  {isRtl ? "غير نشط" : "Inactive"}
                </span>
              )}
              {isOverdue && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-rose-50/50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50">
                  {isRtl ? "متأخر" : "Overdue"}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("schedule")} #{schedule.id.slice(-6)}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/maintenance`)}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          {t("backToList")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
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
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <Clock className="h-3.5 w-3.5" />
                  {t("frequency")}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold", freqDisplay.color)}>
                    <FreqIcon size={14} />
                    {freqDisplay.label}
                  </span>
                  {schedule.frequency === "CUSTOM" && (
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      ({schedule.frequencyDays} {isRtl ? "يوم" : "days"})
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {t("leadDays")}
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {schedule.leadDays} {isRtl ? "يوم" : "days"}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <MapPin className="h-3.5 w-3.5" />
                  {t("location")}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Building size={14} className="text-indigo-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {getLocationName()}
                  </span>
                </div>
                {schedule.locationLevel && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {isRtl ? `المستوى: ${schedule.locationLevel === 'room' ? 'غرفة' : schedule.locationLevel === 'floor' ? 'دور' : 'مبنى'}` :
                      `Level: ${schedule.locationLevel}`}
                  </p>
                )}
              </div>

              {schedule.startDate && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <Calendar className="h-3.5 w-3.5" />
                    {t("startDate")}
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {formatLocalDate(schedule.startDate)}
                  </p>
                </div>
              )}

              {schedule.assetType && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <Tag className="h-3.5 w-3.5" />
                    {t("assetType")}
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Tag size={14} className="text-indigo-400" />
                    {isRtl ? schedule.assetType.name : schedule.assetType.nameEn || schedule.assetType.name}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5" />
                  {t("createdAt")}
                </div>
                <p className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {formatLocalDate(schedule.createdAt)}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5" />
                  {t("updatedAt")}
                </div>
                <p className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {formatLocalDate(schedule.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("executionInfo")}
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-200/30 dark:border-slate-800/30">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {t("lastRun")}
                </span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {schedule.lastRunAt ? formatLocalDate(schedule.lastRunAt) : t("never")}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {t("nextDue")}
                </span>
                <span className={cn(
                  "font-mono font-semibold",
                  isOverdue ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400"
                )}>
                  {nextDue ? formatLocalDate(nextDue) : t("notCalculated")}
                </span>
              </div>
            </div>
          </div>

          {schedule.scheduleAssets && schedule.scheduleAssets.length > 0 && (
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40">
                  <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("specificAssets")}
                </h2>
                <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {schedule.scheduleAssets.length}
                </span>
              </div>

              <div className="space-y-2">
                {schedule.scheduleAssets.map((sa) => (
                  <div
                    key={sa.asset.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30"
                  >
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {isRtl ? sa.asset.name : sa.asset.nameEn || sa.asset.name}
                      </p>
                      <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
                        {sa.asset.code}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-indigo-200/50 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400"
                    >
                      {isRtl ? "مضمن" : "Included"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("notes")}
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {schedule.notes || (isRtl ? "لا توجد ملاحظات إضافية" : "No additional notes")}
            </div>
          </div>

          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <Play className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("actions")}
              </h3>
            </div>
            <Button
              onClick={handleRun}
              disabled={executing || !schedule.isActive}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 gap-2"
            >
              {executing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              {t("runNow")}
            </Button>
            {!schedule.isActive && (
              <p className="text-xs text-rose-500 dark:text-rose-400 text-center font-medium mt-2">
                {t("inactiveHint")}
              </p>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
            <Shield className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              {isRtl
                ? "سيتم إنشاء أمر عمل يتضمن جميع الأصول المستهدفة عند كل تنفيذ."
                : "A work order containing all target assets will be created on each execution."}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/maintenance`)}
            className="w-full rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium h-11 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            {t("backToList")}
          </Button>
        </div>
      </div>
    </div>
  );
}