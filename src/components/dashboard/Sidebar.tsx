"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import {
  Sun,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Globe,
  LogOut,
} from "lucide-react";

import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarSection } from "./SidebarSection";
import { MAIN_MENU_ITEMS, SUPER_ADMIN_ITEMS, NavItem } from "./sidebar-data";

export default function Sidebar() {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  const isRTL = locale === "ar";
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingTicketsCount, setPendingTicketsCount] = useState<number>(0);

  // حالة فتح وإغلاق الأقسام الديناميكية (مفتاح = labelKey للقسم)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // جلب عدد البلاغات المعلقة
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

  // إغلاق جميع الأقسام عند تغيير المسار (اختياري)
  useEffect(() => {
    setOpenSections({});
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
    router.push(newPath);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const getThemeIcon = () => {
    return theme === "light" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-primary" />;
  };

  const commonNavProps = {
    isOpen: sidebarOpen,
    locale,
  };

  // دالة مساعدة لعرض عناصر التنقل بشكل متكرر (تدعم التداخل)
  const renderNavItems = (items: NavItem[], depth: number = 0, parentKey: string = "") => {
    return items.map((item, index) => {
      const key = parentKey + item.labelKey + index;
      const hasChildren = item.children && item.children.length > 0;
      const isActive = item.href
        ? pathname.startsWith(`/${locale}${item.href}`)
        : false;

      // إذا كان العنصر يحتوي على أبناء، نعرضه كـ SidebarSection
      if (hasChildren) {
        const isOpen = openSections[key] ?? false;
        const toggleOpen = () => {
          setOpenSections((prev) => ({
            ...prev,
            [key]: !prev[key],
          }));
        };

        return (
          <SidebarSection
            key={key}
            isOpen={isOpen}
            onOpenChange={toggleOpen}
            triggerIcon={item.icon}
            triggerLabel={getLabel(item.labelKey, item.labelKey)}
            sidebarOpen={sidebarOpen}
          >
            {/* عرض الأبناء مع زيادة العمق */}
            {renderNavItems(item.children!, depth + 1, key + "-")}
          </SidebarSection>
        );
      }

      // عنصر عادي (رابط)
      let badgeCount: number | undefined;
      if (item.href === "/tickets" && pendingTicketsCount > 0) {
        badgeCount = pendingTicketsCount;
      }

      return (
        <SidebarNavItem
          key={key}
          href={item.href!}
          label={getLabel(item.labelKey, item.labelKey)}
          icon={item.icon}
          isActive={isActive}
          badgeCount={badgeCount}
          subItem={depth > 0} // العناصر في المستوى الأول ليست subItem
          {...commonNavProps}
        />
      );
    });
  };

  return (
    <aside
      dir={isRTL ? "rtl" : "ltr"}
      className={cn(
        "sticky top-0 h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-e border-slate-200/50 dark:border-slate-800/50 flex flex-col transition-all duration-300 shadow-sm",
        sidebarOpen ? "w-72" : "w-20"
      )}
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="shrink-0">
              <Image
                src="/logo.png"
                alt="bax24 logo"
                width={38}
                height={38}
                className="rounded-full border-2 border-indigo-600/30 dark:border-indigo-400/30 shadow-sm"
                priority
                unoptimized
              />
            </div>
            {sidebarOpen && (
              <span className="font-black text-xl tracking-tight truncate bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                bax24
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={switchLocale}
              className="h-8 w-8 rounded-full text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              aria-label={locale === "ar" ? "English" : "العربية"}
            >
              <Globe size={15} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 rounded-full text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              aria-label="Toggle theme"
            >
              {getThemeIcon()}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8 rounded-full text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 shrink-0"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 custom-scrollbar">
        {isSuperAdmin && sidebarOpen && (
          <p className="px-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">
            {getLabel("systemAdminSection", "إدارة النظام")}
          </p>
        )}

        {isSuperAdmin
          ? renderNavItems(SUPER_ADMIN_ITEMS, 0, "super-")
          : renderNavItems(MAIN_MENU_ITEMS, 0, "main-")
        }

        {/* زر تسجيل الخروج (يظهر بغض النظر عن الدور) */}
        <button
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          className={cn(
            "w-full flex items-center gap-4 py-3 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all duration-200 mt-1",
            !sidebarOpen && "justify-center px-0"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {sidebarOpen && <span className="text-[15px] font-bold">{getLabel("logout", "تسجيل الخروج")}</span>}
        </button>
      </nav>
      <div className="p-2 shrink-0" />
    </aside>
  );
}