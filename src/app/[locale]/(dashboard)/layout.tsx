'use client';

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { SessionProvider, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const locale = pathname.split("/")[1] || "ar";
  const isRTL = locale === "ar";

  const role = session?.user?.role;

  // 🎯 التحكم حسب الدور
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-background grid grid-cols-[auto_1fr]">
      <Sidebar />

      <div className="flex flex-col w-full">
        
        {/* 🔥 التحكم هنا */}
        {isAdmin && !isSuperAdmin && (
          <Topbar />
        )}

        <main className="p-6 overflow-auto">
          {children}
        </main>

      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  );
}