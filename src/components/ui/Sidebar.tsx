'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Building2, Users, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const locale = params?.locale as string;
  const isRTL = locale === 'ar';

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = `/${locale}/login`;
  };

  const navItems = [
    { href: `/${locale}/super-admin`, label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: `/${locale}/super-admin/companies`, label: 'الشركات', icon: Building2 },
    { href: `/${locale}/super-admin/users`, label: 'المستخدمين', icon: Users },
    { href: `/${locale}/super-admin/settings`, label: 'الإعدادات', icon: Settings },
  ];

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-card border-l border-border p-4 flex flex-col z-40">
      <div className="flex items-center gap-2 mb-8 px-2">
        <span className="text-xl font-bold text-foreground">bax24</span>
        <span className="text-xs text-muted-foreground">Super Admin</span>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition w-full mt-4"
      >
        <LogOut className="w-5 h-5" />
        <span>تسجيل خروج</span>
      </button>
    </aside>
  );
}