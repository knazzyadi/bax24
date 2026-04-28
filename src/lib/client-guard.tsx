// src/lib/client-guard.tsx
'use client';

import { useSession } from "next-auth/react";
import { ReactNode } from "react";
import { Ban } from "lucide-react";
import { PageContainer } from "@/components/shared/detail/PageContainer";

// هوك للاستخدام في Client Components (يعيد معلومات الصلاحية وحالة التحميل)
export function useAdminGuard() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const loading = status === "loading";
  const isAuthenticated = !!session;
  return { isAdmin, loading, isAuthenticated };
}

// مكون لعرض رسالة رفض الوصول بشكل عصري وحديث
export function UnauthorizedMessage() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 text-center animate-in fade-in duration-500">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse" />
          <div className="relative bg-destructive/10 p-5 rounded-full border border-destructive/30 shadow-lg">
            <Ban className="h-14 w-14 text-destructive" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="text-3xl font-black text-destructive mb-2 tracking-tight">غير مصرح</h1>
        <p className="text-muted-foreground text-lg max-w-md">ليس لديك صلاحية للوصول إلى هذه الصفحة.</p>
      </div>
    </PageContainer>
  );
}

// مكون حماية يغلف المحتوى (استخدام مباشر في الصفحات العميلة)
export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAdminGuard();
  if (loading) return <PageContainer><div className="p-6 text-center">جاري التحميل...</div></PageContainer>;
  if (!isAdmin) return <UnauthorizedMessage />;
  return <>{children}</>;
}

// HOC (Higher Order Component) لتغليف الصفحة وحمايتها
export function withAdminGuard<P extends object>(Component: React.ComponentType<P>) {
  return function AdminProtected(props: P) {
    const { isAdmin, loading } = useAdminGuard();
    if (loading) return <PageContainer><div className="p-6 text-center">جاري التحميل...</div></PageContainer>;
    if (!isAdmin) return <UnauthorizedMessage />;
    return <Component {...props} />;
  };
}