"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  AlertCircle,
  BookOpen,
  Settings,
  Tag,
  TrendingUp,
  Truck,
  UserRound,
} from "lucide-react";

// قائمة العناصر الرئيسية (بالترتيب المطلوب - تم نقل المركبات تحت الصيانة الدورية)
const MAIN_MENU_ITEMS = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/work-orders", labelKey: "nav.workOrders", icon: ClipboardList },
  { href: "/reports", labelKey: "nav.reports", icon: FileText },
  { href: "/maintenance", labelKey: "nav.maintenance", icon: Calendar },
  { href: "/vehicle-requests", labelKey: "nav.vehicles", icon: Car }, // ← المركبات هنا
  { href: "/contracts", labelKey: "nav.contracts", icon: FileSpreadsheet },
  { href: "/assets", labelKey: "nav.assets", icon: Package },
  { href: "/inventory", labelKey: "nav.inventory", icon: Box },
];

// قائمة عناصر السوبر أدمن
const SUPER_ADMIN_ITEMS = [
  { href: "/super-admin", labelKey: "nav.superDashboard", icon: ShieldCheck },
  { href: "/super-admin/companies", labelKey: "nav.companies", icon: Building2 },
  { href: "/super-admin/users", labelKey: "nav.users", icon: Users },
  { href: "/super-admin/settings", labelKey: "nav.settings", icon: Settings },
];

export default function Sidebar() {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();

  const locale = pathname.split("/")[1] || "ar";
  const isRTL = locale === "ar";

  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [locationsOpen, setLocationsOpen] = useState(false);
  const [vehiclesSettingsOpen, setVehiclesSettingsOpen] = useState(false);
  const [dictionariesOpen, setDictionariesOpen] = useState(false);

  // Refs للقوائم القابلة للطي
  const settingsRef = useRef<HTMLDivElement>(null);
  const locationsRef = useRef<HTMLDivElement>(null);
  const vehiclesRef = useRef<HTMLDivElement>(null);
  const dictionariesRef = useRef<HTMLDivElement>(null);

  // إغلاق القوائم عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    if (settingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationsRef.current && !locationsRef.current.contains(event.target as Node)) {
        setLocationsOpen(false);
      }
    };
    if (locationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [locationsOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vehiclesRef.current && !vehiclesRef.current.contains(event.target as Node)) {
        setVehiclesSettingsOpen(false);
      }
    };
    if (vehiclesSettingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [vehiclesSettingsOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dictionariesRef.current && !dictionariesRef.current.contains(event.target as Node)) {
        setDictionariesOpen(false);
      }
    };
    if (dictionariesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dictionariesOpen]);

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

  const switchLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    window.location.href = newPath;
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

  return (
    <aside
      dir={isRTL ? "rtl" : "ltr"}
      className={cn(
        "sticky top-0 h-screen bg-card border-e border-border flex flex-col",
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
              title={locale === "ar" ? "English" : "العربية"}
            >
              <Globe size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-7 w-7 rounded-full"
            >
              {getThemeIcon()}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-7 w-7 rounded-full shrink-0"
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
              isActive={pathname === `/${locale}${item.href}`}
              locale={locale}
            />
          ))}

        {!isSuperAdmin &&
          MAIN_MENU_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              label={getLabel(item.labelKey, item.labelKey)}
              icon={item.icon}
              isOpen={sidebarOpen}
              isActive={pathname === `/${locale}${item.href}`}
              locale={locale}
            />
          ))}

        {!isSuperAdmin && (
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen} className="space-y-1">
            <CollapsibleTrigger
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 text-muted-foreground font-bold text-[15px] rounded-2xl hover:bg-secondary transition-all",
                !sidebarOpen && "justify-center px-0"
              )}
            >
              <div className="flex items-center gap-4">
                <Settings className="h-5 w-5 group-hover:text-primary transition-colors" />
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
                    className="w-full flex items-center justify-between px-4 py-2 text-muted-foreground font-bold text-[13px] rounded-xl hover:bg-secondary/50 transition-all"
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
                    className="w-full flex items-center justify-between px-4 py-2 text-muted-foreground font-bold text-[13px] rounded-xl hover:bg-secondary/50 transition-all"
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
                    className="w-full flex items-center justify-between px-4 py-2 text-muted-foreground font-bold text-[13px] rounded-xl hover:bg-secondary/50 transition-all"
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
                      href="/admin/asset-types"
                      label={getLabel("nav.assetTypes", "أنواع الأصول")}
                      icon={Tag}
                      isOpen={sidebarOpen}
                      subItem
                      locale={locale}
                    />
                    <SidebarNavItem
                      href="/admin/work-order-statuses"
                      label={getLabel("nav.workOrderStatuses", "حالات أوامر العمل")}
                      icon={ClipboardList}
                      isOpen={sidebarOpen}
                      subItem
                      locale={locale}
                    />
                    <SidebarNavItem
                      href="/admin/asset-statuses"
                      label={getLabel("nav.assetStatuses", "حالات الأصول")}
                      icon={Package}
                      isOpen={sidebarOpen}
                      subItem
                      locale={locale}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* إعداد الصلاحيات */}
              <SidebarNavItem
                href="/dashboard/users"
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

              {/* زر تسجيل الخروج */}
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

// مكون عنصر التنقل المساعد
function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isOpen,
  isActive,
  subItem,
  locale,
}: {
  href: string;
  label: string;
  icon: any;
  isOpen: boolean;
  isActive?: boolean;
  subItem?: boolean;
  locale: string;
}) {
  const finalHref = `/${locale}${href}`;
  return (
    <Link
      href={finalHref}
      className={cn(
        "flex items-center gap-4 transition-all duration-200 group relative rounded-2xl",
        !isOpen ? "justify-center px-0" : "px-4",
        isActive
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
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
      {isOpen && (
        <span
          className={cn(
            "truncate tracking-tight",
            subItem ? "text-[13px] font-medium" : "text-[15px] font-bold",
            isActive && "font-black"
          )}
        >
          {label}
        </span>
      )}
    </Link>
  );
}