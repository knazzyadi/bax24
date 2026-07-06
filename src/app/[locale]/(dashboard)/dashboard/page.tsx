// src/app/[locale]/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  ClipboardList,
  Package,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Wrench,
  ShieldCheck,
  Zap,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
  Server,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  assets: number;
  workOrders: number;
  lowInventory: number;
  pendingRequests: number;
}

interface StatsResponse {
  count?: number;
  error?: string;
}

// =========================
// تنسيقات موحدة
// =========================
const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const isRTL = locale === "ar";
  const t = useTranslations("Dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<DashboardData>({
    assets: 0,
    workOrders: 0,
    lowInventory: 0,
    pendingRequests: 0,
  });
  const [systemUptime, setSystemUptime] = useState<string>("");

  const isSessionLoading = status === "loading";

  let companyDisplayName = isRTL ? "شركتك" : "Your Company";
  if (!isSessionLoading && session?.user) {
    if (isRTL) {
      companyDisplayName = session.user.companyName || "شركتك";
    } else {
      companyDisplayName = session.user.companyNameEn || session.user.companyName || "Your Company";
    }
  }

  useEffect(() => {
    const startTime = new Date();
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      setSystemUptime(
        isRTL
          ? `${hours} ساعة ${minutes} دقيقة`
          : `${hours}h ${minutes}m`
      );
    }, 60000);
    return () => clearInterval(interval);
  }, [isRTL]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const endpoints = [
        "/api/stats/assets-count",
        "/api/stats/work-orders-count",
        "/api/stats/low-inventory-count",
        "/api/tickets/count?status=PENDING",
      ];

      const results = await Promise.allSettled(
        endpoints.map(async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json: StatsResponse = await res.json();
          if (typeof json === "number") return json;
          return json.count ?? 0;
        })
      );

      const values = results.map((result) => (result.status === "fulfilled" ? result.value : 0));

      const [assets, workOrders, lowInventory, pendingTickets] = values;

      setData({
        assets: assets ?? 0,
        workOrders: workOrders ?? 0,
        lowInventory: lowInventory ?? 0,
        pendingRequests: pendingTickets ?? 0,
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statsCards = useMemo(
    () => [
      {
        title: t("stats.assets.title"),
        value: data.assets,
        icon: Package,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        description: t("stats.assets.description"),
        href: `/${locale}/assets`,
      },
      {
        title: t("stats.workOrders.title"),
        value: data.workOrders,
        icon: ClipboardList,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        description: t("stats.workOrders.description"),
        href: `/${locale}/work-orders`,
      },
      {
        title: t("stats.lowInventory.title"),
        value: data.lowInventory,
        icon: AlertTriangle,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        description: t("stats.lowInventory.description"),
        href: `/${locale}/inventory?status=low`,
      },
      {
        title: t("stats.pendingRequests.title"),
        value: data.pendingRequests,
        icon: Activity,
        color: "text-pink-500",
        bg: "bg-pink-500/10",
        description: t("stats.pendingRequests.description"),
        href: `/${locale}/tickets?status=PENDING`,
      },
    ],
    [data, t, locale]
  );

  if (isSessionLoading) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={cn(
        "relative min-h-screen p-6 space-y-8",
        isRTL ? "text-right" : "text-left"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      <header className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t("header.title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {t("header.welcome", { company: companyDisplayName })}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="rounded-full px-4 py-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
          {t("stats.live")}
        </Badge>
      </header>

      <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link
              key={i}
              href={stat.href}
              className={cn(
                "group relative flex flex-col p-6 rounded-3xl transition-all duration-300 cursor-pointer",
                "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm",
                "border border-slate-200/50 dark:border-slate-800/50",
                "hover:bg-white/90 dark:hover:bg-slate-900/90",
                "hover:scale-[1.02] hover:shadow-xl",
                "shadow-sm hover:shadow-indigo-500/5 dark:hover:shadow-indigo-400/5"
              )}
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                      {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                      ) : (
                        stat.value.toLocaleString()
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 line-clamp-1">
                    {stat.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
                    stat.bg
                  )}
                >
                  <Icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>

              <div className="relative z-10 mt-3 flex items-center gap-1 text-xs font-medium text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {isRTL ? "عرض التفاصيل" : "View details"}
                <ArrowUpRight className={cn("h-3 w-3", isRTL && "rotate-180")} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* ✅ قسم الوصول السريع - مع padding داخلي كافٍ */}
      <div className="relative grid gap-6 md:grid-cols-5">
        <div className={cn("md:col-span-3", glassCard)}>
          <CardHeader className="pb-2 pt-5 px-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200/50 dark:border-amber-800/30">
                <Zap className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {t("quickAccess.title")}
              </CardTitle>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mr-11">
              {isRTL
                ? "أنشئ أوامر عمل وأصول جديدة بسرعة"
                : "Quickly create work orders and assets"}
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickActionLink
                href={`/${locale}/work-orders/new`}
                title={t("quickActions.newWorkOrder")}
                icon={Wrench}
                description={t("quickActions.newWorkOrderDesc")}
                variant="blue"
                isRTL={isRTL}
              />
              <QuickActionLink
                href={`/${locale}/assets/new`}
                title={t("quickActions.newAsset")}
                icon={Package}
                description={t("quickActions.newAssetDesc")}
                variant="emerald"
                isRTL={isRTL}
              />
              <QuickActionLink
                href={`/${locale}/tickets/new`}
                title={isRTL ? "بلاغ جديد" : "New Ticket"}
                icon={Activity}
                description={isRTL ? "إنشاء بلاغ صيانة جديد" : "Create a new maintenance ticket"}
                variant="purple"
                isRTL={isRTL}
              />
              <QuickActionLink
                href={`/${locale}/inventory/new`}
                title={isRTL ? "إضافة مخزون" : "Add Inventory"}
                icon={Package}
                description={isRTL ? "إضافة عنصر جديد للمخزون" : "Add a new inventory item"}
                variant="amber"
                isRTL={isRTL}
              />
            </div>
          </CardContent>
        </div>

        {/* ✅ بطاقة حالة النظام - مع padding داخلي كافٍ */}
        <div className={cn("md:col-span-2", glassCard)}>
          <CardHeader className="pb-2 pt-5 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/40 dark:to-indigo-900/20 border border-indigo-200/50 dark:border-indigo-800/30">
                  <ShieldCheck className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {t("systemStatus.title")}
                </CardTitle>
              </div>
              <Badge className="rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] font-medium px-3 py-1">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {isRTL ? "نشط" : "Active"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Server className="h-4 w-4 text-indigo-400" />
                  <span>{isRTL ? "الخادم" : "Server"}</span>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
                  {isRTL ? "يعمل" : "Online"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span>{isRTL ? "وقت التشغيل" : "Uptime"}</span>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
                  {systemUptime || (isRTL ? "جاري التحميل..." : "Loading...")}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>{isRTL ? "حالة المزامنة" : "Sync Status"}</span>
                <span>100%</span>
              </div>
              <div className="h-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 w-full rounded-full transition-all duration-1000" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <Users className="h-3.5 w-3.5" />
                <span>
                  {isRTL
                    ? `${data.pendingRequests} طلب معلق`
                    : `${data.pendingRequests} pending requests`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-500 dark:text-emerald-400 font-medium">
                  {isRTL ? "مزامنة حية" : "Live sync"}
                </span>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
}

// =========================
// مكون الرابط السريع
// =========================
function QuickActionLink({
  href,
  title,
  icon: Icon,
  description,
  variant,
  isRTL,
}: {
  href: string;
  title: string;
  icon: any;
  description: string;
  variant: "blue" | "emerald" | "purple" | "amber";
  isRTL: boolean;
}) {
  const variants = {
    blue: "text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/30 dark:border-indigo-800/30",
    emerald:
      "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-800/30",
    purple:
      "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-800/30",
    amber:
      "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800/30",
  };

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all group hover:shadow-md active:scale-[0.98]",
        isRTL ? "flex-row-reverse" : "",
        variants[variant]
      )}
    >
      <div
        className={cn(
          "p-3 rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
          variants[variant].split(" ").slice(0, 1).join(" "),
          variants[variant].split(" ").slice(1, 2).join(" ")
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{description}</p>
      </div>
      <ArrowUpRight
        className={cn(
          "h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform",
          isRTL && "rotate-180"
        )}
      />
    </Link>
  );
}