// src/components/dashboard/Sidebar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Box,
  Calendar,
  FileText,
  FileSpreadsheet,
  Building2,
  Sun,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Car,
  Globe,
  LogOut,
  ChevronDown,
  Layers,
  Building,
  Home,
  Users,
  KeyRound,
  ShieldCheck,
  BookOpen,
  Settings,
  Tag,
  TrendingUp,
  Truck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// قائمة العناصر الرئيسية
const MAIN_MENU_ITEMS = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/work-orders", labelKey: "nav.workOrders", icon: ClipboardList },
  { href: "/tickets", labelKey: "nav.tickets", icon: FileText },
  { href: "/maintenance", labelKey: "nav.maintenance", icon: Calendar },
  { href: "/vehicle-requests", labelKey: "nav.vehicles", icon: Car },
  { href: "/contracts", labelKey: "nav.contracts", icon: FileSpreadsheet },
  { href: "/assets", labelKey: "nav.assets", icon: Package },
  { href: "/inventory", labelKey: "nav.inventory", icon: Box },
];

// قائمة عناصر السوبر أدمن
const SUPER_ADMIN_ITEMS = [
  { href: "/super-admin", labelKey: "nav.superDashboard", icon: ShieldCheck },
  { href: "/super-admin/companies", labelKey: "nav.companies", icon: Building2 },
  { href: "/super-admin/branches", labelKey: "nav.branches", icon: Building },
  { href: "/super-admin/users", labelKey: "nav.users", icon: Users },
  { href: "/super-admin/settings", labelKey: "nav.settings", icon: Settings },
];

export default function Sidebar() {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale(); // ✅ أفضل من pathname.split
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  const isRTL = locale === "ar";
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [locationsOpen, setLocationsOpen] = useState(false);
  const [vehiclesSettingsOpen, setVehiclesSettingsOpen] = useState(false);
  const [dictionariesOpen, setDictionariesOpen] = useState(false);
  const [pendingTicketsCount, setPendingTicketsCount] = useState<number>(0);

  // Refs للقوائم
  const settingsRef = useRef<HTMLDivElement>(null);
  const locationsRef = useRef<HTMLDivElement>(null);
  const vehiclesRef = useRef<HTMLDivElement>(null);
  const dictionariesRef = useRef<HTMLDivElement>(null);

  // ✅ استخدام الـ Hook الموحد بدلاً من useEffect المكررة
  useOutsideClick(settingsRef, () => setSettingsOpen(false), settingsOpen);
  useOutsideClick(locationsRef, () => setLocationsOpen(false), locationsOpen);
  useOutsideClick(vehiclesRef, () => setVehiclesSettingsOpen(false), vehiclesSettingsOpen);
  useOutsideClick(dictionariesRef, () => setDictionariesOpen(false), dictionariesOpen);

  // ✅ جلب عدد البلاغات المعلقة
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await fetch("/api/tickets/count?status=PENDING");
        if (res.ok) {
          const data = await res.json();
          setPendingTicketsCount(data.count || 0);
        } else {
          setPendingTicketsCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch pending tickets count", error);
        setPendingTicketsCount(0);
      }
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // إغلاق القوائم عند تغيير المسار
  useEffect(() => {
    setSettingsOpen(false);
    setLocationsOpen(false);
    setVehiclesSettingsOpen(false);
    setDictionariesOpen(false);
  }, [pathname]);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const getLabel = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  // ✅ استخدام router.push بدلاً من window.location.href
  const switchLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const getThemeIcon = () => {
    return theme === "light" ? (
      <Sun className="h-4 w-4 text-amber-500" />
    ) : (
      <Moon className="h-4 w-4 text-primary" />
    );
  };

  const renderNavItem = (item: typeof MAIN_MENU_ITEMS[0]) => {
    let badgeCount: number | undefined;
    if (item.href === "/tickets" && pendingTicketsCount > 0) {
      badgeCount = pendingTicketsCount;
    }
    return (
      <SidebarNavItem
        key={item.href}
        href={item.href}
        label={getLabel(item.labelKey, item.labelKey)}
        icon={item.icon}
        isOpen={sidebarOpen}
        isActive={pathname.startsWith(`/${locale}${item.href}`)} // ✅ استخدام startsWith
        locale={locale}
        badgeCount={badgeCount}
      />
    );
  };

  return (
    <aside
      dir={isRTL ? "rtl" : "ltr"}
      className={cn(
        "sticky top-0 h-screen bg-card border-e border-border flex flex-col transition-all duration-300", // ✅ إضافة transition
        sidebarOpen ? "w-72" : "w-20"
      )}
    >
      {/* Header */}
      <div className="p-5 border-b border-border/40 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="shrink-0">
              <Image
                src="/logo.png"
                alt="bax24 logo"
                width={38}
                height={38}
                className="rounded-full border-2 border-black dark:border-white"
                priority
                unoptimized
              />
            </div>
            {sidebarOpen && (
              <span className="font-black text-xl tracking-tight truncate text-foreground animate-in fade-in duration-500">
                bax24
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={switchLocale}
              className="h-7 w-7 rounded-full"
              aria-label={locale === "ar" ? "English" : "العربية"}
            >
              <Globe size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-7 w-7 rounded-full"
              aria-label="Toggle theme"
            >
              {getThemeIcon()}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-7 w-7 rounded-full shrink-0"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
        {isSuperAdmin && sidebarOpen && (
          <p className="px-4 text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">
            {getLabel("systemAdminSection", "إدارة النظام")}
          </p>
        )}

        {isSuperAdmin &&
          SUPER_ADMIN_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              label={getLabel(item.labelKey, item.labelKey)}
              icon={item.icon}
              isOpen={sidebarOpen}
              isActive={pathname.startsWith(`/${locale}${item.href}`)}
              locale={locale}
            />
          ))}

        {!isSuperAdmin && MAIN_MENU_ITEMS.map((item) => renderNavItem(item))}

        {!isSuperAdmin && (
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen} className="space-y-1">
            <CollapsibleTrigger
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 text-muted-foreground font-bold text-[15px] rounded-2xl hover:bg-primary/10 hover:text-primary transition-all",
                !sidebarOpen && "justify-center px-0"
              )}
            >
              <div className="flex items-center gap-4">
                <Settings className="h-5 w-5" />
                {sidebarOpen && <span>{getLabel("settings", "الإعدادات")}</span>}
              </div>
              {sidebarOpen && (
                <ChevronDown
                  size={16}
                  className={cn("transition-transform duration-300", settingsOpen && "rotate-180")}
                />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pr-6 border-r-2 border-primary/10 mr-4 animate-in slide-in-from-top-2">
              {/* إعداد المواقع */}
              <div ref={locationsRef}>
                <Collapsible open={locationsOpen} onOpenChange={setLocationsOpen} className="space-y-1">
                  <CollapsibleTrigger
                    className="w-full flex items-center justify-between px-4 py-2 text-muted-foreground font-bold text-[13px] rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      {sidebarOpen && <span>{getLabel("locationsSettings", "إعداد المواقع")}</span>}
                    </div>
                    {sidebarOpen && (
                      <ChevronDown
                        size={14}
                        className={cn("transition-transform", locationsOpen && "rotate-180")}
                      />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pr-4">
                    <SidebarNavItem
                      href="/locations/buildings"
                      label={getLabel("nav.buildings", "المباني")}
                      icon={Building}
                      isOpen={sidebarOpen}
                      subItem
                      locale={locale}
                    />
                    <SidebarNavItem
                      href="/locations/floors"
                      label={getLabel("nav.floors", "الأدوار")}
                      icon={Layers}
                      isOpen={sidebarOpen}
                      subItem
                      locale={locale}
                    />
                    <SidebarNavItem
                      href="/locations/rooms"
                      label={getLabel("nav.rooms", "الغرف")}
                      icon={Home}
                      isOpen={sidebarOpen}
                      subItem
                      locale={locale}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* إعداد المركبات */}
              <div ref={vehiclesRef}>
                <Collapsible open={vehiclesSettingsOpen} onOpenChange={setVehiclesSettingsOpen} className="space-y-1">
                  <CollapsibleTrigger
                    className="w-full flex items-center justify-between px-4 py-2 text-muted-foreground font-bold text-[13px] rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      {sidebarOpen && <span>{getLabel("vehiclesSettings", "إعداد المركبات")}</span>}
                    </div>
                    {sidebarOpen && (
                      <ChevronDown
                        size={14}
                        className={cn("transition-transform", vehiclesSettingsOpen && "rotate-180")}
                      />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pr-4">
                    <SidebarNavItem
                      href="/admin/drivers"
                      label={getLabel("nav.drivers", "السائقين")}
                      icon={UserRound}
                      isOpen={sidebarOpen}
                      subItem
                      locale={locale}
                    />
                    <SidebarNavItem
                      href="/admin/vehicles"
                      label={getLabel("nav.vehiclesList", "المركبات")}
                      icon={Truck}
                      isOpen={sidebarOpen}
                      subItem
                      locale={locale}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* إعداد المعجم */}
              <div ref={dictionariesRef}>
                <Collapsible open={dictionariesOpen} onOpenChange={setDictionariesOpen} className="space-y-1">
                  <CollapsibleTrigger
                    className="w-full flex items-center justify-between px-4 py-2 text-muted-foreground font-bold text-[13px] rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {sidebarOpen && <span>{getLabel("dictionariesSettings", "إعداد المعجم")}</span>}
                    </div>
                    {sidebarOpen && (
                      <ChevronDown
                        size={14}
                        className={cn("transition-transform", dictionariesOpen && "rotate-180")}
                      />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pr-4">
                    <SidebarNavItem
                      href="/settings/asset-types"
                      label={getLabel("nav.assetTypes", "أنواع الأصول")}
                      icon={Tag}
                      isOpen={sidebarOpen}
                      subItem
                      locale={locale}
                    />
                    <SidebarNavItem
                      href="/settings/work-order-statuses"
                      label={getLabel("nav.workOrderStatuses", "حالات أوامر العمل")}
                      icon={ClipboardList}
                      isOpen={sidebarOpen}
                      subItem
                      locale={locale}
                    />
                    <SidebarNavItem
                      href="/settings/asset-statuses"
                      label={getLabel("nav.assetStatuses", "حالات الأصول")}
                      icon={Package}
                      isOpen={sidebarOpen}
                      subItem
                      locale={locale}
                    />
                    <SidebarNavItem
                      href="/settings/work-order-priorities"
                      label={getLabel("nav.workOrderPriorities", "أولويات أوامر العمل")}
                      icon={TrendingUp}
                      isOpen={sidebarOpen}
                      subItem
                      locale={locale}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* إعداد الصلاحيات */}
              <SidebarNavItem
                href="/users"
                label={getLabel("nav.users", "المستخدمون")}
                icon={Users}
                isOpen={sidebarOpen}
                subItem
                locale={locale}
              />
              <SidebarNavItem
                href="/admin/roles-permissions"
                label={getLabel("nav.permissions", "الصلاحيات")}
                icon={KeyRound}
                isOpen={sidebarOpen}
                subItem
                locale={locale}
              />

              <button
                onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
                className={cn(
                  "w-full flex items-center gap-4 py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl mt-2",
                  !sidebarOpen && "justify-center px-0"
                )}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="text-[15px] font-bold">{getLabel("logout", "تسجيل الخروج")}</span>}
              </button>
            </CollapsibleContent>
          </Collapsible>
        )}

        {!isSuperAdmin && !sidebarOpen && (
          <button
            onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
            className="w-full flex justify-center py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl mt-4"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
            className={cn(
              "w-full flex items-center gap-4 py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl mt-4",
              !sidebarOpen && "justify-center px-0"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span className="text-[15px] font-bold">{getLabel("logout", "تسجيل الخروج")}</span>}
          </button>
        )}
      </nav>
      <div className="p-2 shrink-0" />
    </aside>
  );
}

// مكون عنصر التنقل مع دعم الإشعارات
function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isOpen,
  isActive,
  subItem,
  locale,
  badgeCount,
}: {
  href: string;
  label: string;
  icon: LucideIcon; // ✅ تحسين Type Safety
  isOpen: boolean;
  isActive?: boolean;
  subItem?: boolean;
  locale: string;
  badgeCount?: number;
}) {
  const finalHref = `/${locale}${href}`;
  return (
    <Link
      href={finalHref}
      className={cn(
        "flex items-center gap-4 transition-all duration-200 group relative rounded-2xl",
        !isOpen ? "justify-center px-0" : "px-4",
        isActive
          ? "bg-black text-white dark:bg-white dark:text-black shadow-lg"
          : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
        subItem ? "py-2 pl-6" : "py-3.5"
      )}
    >
      <Icon
        className={cn(
          "shrink-0 transition-transform duration-300",
          subItem ? "h-4 w-4" : "h-5 w-5",
          isOpen && "group-hover:scale-110"
        )}
      />
      {isOpen ? (
        <span className="flex-1 flex items-center justify-between truncate tracking-tight">
          <span
            className={cn(
              subItem ? "text-[13px] font-medium" : "text-[15px] font-bold",
              isActive && "font-black"
            )}
          >
            {label}
          </span>
          {badgeCount !== undefined && badgeCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
        </span>
      ) : (
        badgeCount !== undefined && badgeCount > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )
      )}
    </Link>
  );
}