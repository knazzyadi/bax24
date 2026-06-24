'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const locale = params?.locale as string;
  const isRTL = locale === 'ar';
  const t = useTranslations('Dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<DashboardData>({
    assets: 0,
    workOrders: 0,
    lowInventory: 0,
    pendingRequests: 0,
  });

  const isSessionLoading = status === 'loading';

  let companyDisplayName = 'شركتك';
  if (!isSessionLoading && session?.user) {
    if (locale === 'ar') {
      companyDisplayName = session.user.companyName || 'شركتك';
    } else {
      companyDisplayName = session.user.companyNameEn || session.user.companyName || 'Your Company';
    }
  }

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const endpoints = [
        '/api/stats/assets-count',
        '/api/stats/work-orders-count',
        '/api/stats/low-inventory-count',
        '/api/tickets/count?status=PENDING',
      ];

      const results = await Promise.allSettled(
        endpoints.map(async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json: StatsResponse = await res.json();
          if (typeof json === 'number') return json;
          return json.count ?? 0;
        })
      );

      const values = results.map((result) => (result.status === 'fulfilled' ? result.value : 0));

      const [assets, workOrders, lowInventory, pendingTickets] = values;
      
      setData({
        assets: assets ?? 0,
        workOrders: workOrders ?? 0,
        lowInventory: lowInventory ?? 0,
        pendingRequests: pendingTickets ?? 0,
      });
    } catch (err) {
      console.error('Dashboard error:', err);
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
        title: t('stats.assets.title'),
        value: data.assets,
        icon: Package,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        description: t('stats.assets.description'),
      },
      {
        title: t('stats.workOrders.title'),
        value: data.workOrders,
        icon: ClipboardList,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        description: t('stats.workOrders.description'),
      },
      {
        title: t('stats.lowInventory.title'),
        value: data.lowInventory,
        icon: AlertTriangle,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        description: t('stats.lowInventory.description'),
      },
      {
        title: t('stats.pendingRequests.title'),
        value: data.pendingRequests,
        icon: Activity,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
        description: t('stats.pendingRequests.description'),
      },
    ],
    [data, t]
  );

  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn(
        'min-h-screen bg-background p-6 space-y-10 animate-in fade-in duration-700',
        isRTL ? 'text-right' : 'text-left'
      )}
    >
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t('header.title')}
        </h1>
        <p className="text-muted-foreground font-medium">
          {t('header.welcome', { company: companyDisplayName })}
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, i) => (
          <Card key={i} className="relative overflow-hidden transition-all hover:shadow-md group">
            <CardHeader
              className={cn(
                'flex flex-row items-center justify-between pb-2',
                isRTL ? 'flex-row-reverse' : ''
              )}
            >
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className={cn('p-2 rounded-lg transition-transform group-hover:scale-110', stat.bg)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn('flex items-baseline gap-2', isRTL ? 'flex-row-reverse justify-end' : '')}>
                <span className="text-3xl font-bold tracking-tight">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : stat.value.toLocaleString()}
                </span>
                {!loading && (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-bold">
                    <TrendingUp className="h-3 w-3 mr-1" /> {t('stats.live')}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3 line-clamp-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
              {t('quickAccess.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickActionLink
              href="/work-orders/new"
              title={t('quickActions.newWorkOrder')}
              icon={Wrench}
              description={t('quickActions.newWorkOrderDesc')}
              variant="blue"
              isRTL={isRTL}
            />
            <QuickActionLink
              href="/assets/new"
              title={t('quickActions.newAsset')}
              icon={Package}
              description={t('quickActions.newAssetDesc')}
              variant="emerald"
              isRTL={isRTL}
            />
          </CardContent>
        </Card>

        {/* ✅ بطاقة حالة النظام المحسّنة */}
        <Card className="relative overflow-hidden transition-all hover:shadow-md group border bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-bold">{t('systemStatus.title')}</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className={cn('flex items-center gap-3', isRTL ? 'flex-row-reverse' : '')}>
              <span className="font-semibold text-foreground">{t('systemStatus.message')}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>{t('systemStatus.sync')}</span>
                <span>100%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full">
                <div className="h-full bg-primary w-full rounded-full transition-all duration-1000" />
              </div>
            </div>
          </CardContent>
          <Activity className={cn(
            'absolute -bottom-4 h-32 w-32 text-primary/5 group-hover:scale-110 transition-transform duration-500',
            isRTL ? '-left-4' : '-right-4'
          )} />
        </Card>
      </div>
    </div>
  );
}

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
  variant: 'blue' | 'emerald';
  isRTL: boolean;
}) {
  const variants = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-800/30',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-800/30',
  };

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all group hover:shadow-sm active:scale-[0.98]',
        isRTL ? 'flex-row-reverse' : ''
      )}
    >
      <div className={cn('p-3 rounded-lg transition-transform group-hover:scale-110 group-hover:-rotate-3', variants[variant])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-foreground text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
      </div>
      <ArrowUpRight className={cn('h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform', isRTL && 'rotate-180')} />
    </Link>
  );
}