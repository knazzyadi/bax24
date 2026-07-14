// src/lib/client-guard.tsx
'use client';

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { Ban, Loader2 } from "lucide-react";
// ✅ تغيير المسار من detail إلى layout حسب دليل المكونات
import { PageContainer } from "@/components/shared/layout/PageContainer";

// =========================
// هوك مخصص للتحقق من صلاحية المدير
// =========================
export function useAdminGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const isUnauthenticated = status === "unauthenticated";

  // إعادة التوجيه إلى login إذا لم يكن مسجلاً
  useEffect(() => {
    if (isUnauthenticated) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [isUnauthenticated, router, pathname]);

  return {
    isAdmin,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    session,
    status,
  };
}

// =========================
// مكون عرض التحميل (مُحسَّن)
// =========================
export function LoadingGuard() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
          <Loader2 className="h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-spin relative" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">جاري التحميل...</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">التحقق من الصلاحيات</p>
        </div>
      </div>
    </PageContainer>
  );
}

// =========================
// مكون عرض رفض الوصول (مُحسَّن)
// =========================
export function UnauthorizedMessage() {
  const router = useRouter();

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
        <p className="text-muted-foreground text-lg max-w-md">
          ليس لديك صلاحية للوصول إلى هذه الصفحة.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
        >
          العودة إلى لوحة التحكم
        </button>
      </div>
    </PageContainer>
  );
}

// =========================
// مكون الحماية (يُستخدم في الصفحات العميلة)
// =========================
export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading, isUnauthenticated } = useAdminGuard();

  // أثناء التحقق من الجلسة
  if (isLoading) {
    return <LoadingGuard />;
  }

  // إذا لم يكن مسجلاً، useAdminGuard يعيد التوجيه تلقائياً
  if (isUnauthenticated) {
    return null; // لا نعرض شيئاً أثناء إعادة التوجيه
  }

  // إذا لم يكن مديراً
  if (!isAdmin) {
    return <UnauthorizedMessage />;
  }

  // مصرح له
  return <>{children}</>;
}

// =========================
// HOC (Higher Order Component) لتغليف الصفحات
// =========================
export function withAdminGuard<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AdminProtected(props: P) {
    const { isAdmin, isLoading, isUnauthenticated } = useAdminGuard();

    if (isLoading) {
      return <LoadingGuard />;
    }

    if (isUnauthenticated) {
      return null;
    }

    if (!isAdmin) {
      return <UnauthorizedMessage />;
    }

    return <Component {...props} />;
  };
}