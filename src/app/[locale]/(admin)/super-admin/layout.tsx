'use client';

import Sidebar from "@/components/dashboard/Sidebar";
import { usePathname } from "next/navigation";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ar";
  const isRTL = locale === "ar";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-background grid grid-cols-[auto_1fr]"
    >
      <Sidebar />
      <main className="p-6 overflow-auto">{children}</main>
    </div>
  );
}