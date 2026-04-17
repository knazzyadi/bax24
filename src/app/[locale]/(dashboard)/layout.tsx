'use client';

import Sidebar from "@/components/dashboard/Sidebar";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ar";
  const isRTL = locale === "ar";

  return (
    <SessionProvider>
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="min-h-screen bg-background grid grid-cols-[auto_1fr]"
      >
        <Sidebar />
        <main className="p-6 overflow-auto">{children}</main>
      </div>
    </SessionProvider>
  );
}