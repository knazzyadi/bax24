// src/lib/auth/auth-helper.ts

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { cache } from "react";
import { getUserPermissionsFromRole } from "./permissions";
import { NextResponse } from "next/server";

// ============================================================
// 1. تعريف نوع المستخدم القادم من Session
// ============================================================

type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
  companyId?: string | null;
  companyName?: string | null;
  companyNameEn?: string | null;
  branchId?: string | null;
  branchIds?: string[] | null;
};

// ============================================================
// 2. تعريف AuthSession
// ============================================================

export type AuthSession = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    companyId?: string | null;
    branchId?: string | null;
    branchIds?: string[] | null;
  };
  expires: string;
} & {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  companyId: string | null;
  companyName?: string | null;
  companyNameEn?: string | null;
  branchId?: string | null;
  branchIds?: string[] | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

// ============================================================
// 3. جلب الجلسة الأساسية
// ============================================================

export const getAuthSession = cache(async (): Promise<AuthSession | null> => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const user = session.user as SessionUser;
  const role = user.role || "USER";

  return {
    ...session,

    userId: user.id,
    email: user.email,
    name: user.name || null,
    role,

    companyId: user.companyId ?? null,
    companyName: user.companyName ?? null,
    companyNameEn: user.companyNameEn ?? null,

    branchId: user.branchId ?? null,
    branchIds: user.branchIds ?? [],

    isAdmin: role === "ADMIN" || role === "SUPER_ADMIN",
    isSuperAdmin: role === "SUPER_ADMIN",

    user: {
      id: user.id,
      email: user.email,
      name: user.name || null,
      role,

      companyId: user.companyId ?? null,
      branchId: user.branchId ?? null,
      branchIds: user.branchIds ?? [],
    },
  };
});

// ============================================================
// 4. جلب الجلسة المؤكدة
// ============================================================

export const getAuthenticatedSession = cache(
  async (): Promise<AuthSession> => {
    const session = await getAuthSession();

    if (!session) {
      throw new Error("Unauthorized: No session found");
    }

    return session;
  }
);

// ============================================================
// 5. التحقق من الصلاحيات
// ============================================================

export const checkPermission = (
  session: AuthSession | null,
  required?: string | string[]
): boolean => {
  if (!session) {
    return false;
  }

  const role = session.role || "USER";

  if (!required) {
    return true;
  }

  if (role === "SUPER_ADMIN") {
    return true;
  }

  const requiredList = Array.isArray(required)
    ? required
    : [required];

  if (requiredList.some((req) => req === role)) {
    return true;
  }

  const userPermissions = getUserPermissionsFromRole(role);

  if (
    requiredList.some(
      (req) =>
        userPermissions.includes(req) ||
        userPermissions.includes("*")
    )
  ) {
    return true;
  }

  return false;
};

// ============================================================
// 6. طلب صلاحية مع رمي خطأ
// ============================================================

export const requirePermission = cache(
  async (required?: string | string[]): Promise<AuthSession> => {
    const session = await getAuthenticatedSession();

    const role = session.role || "USER";

    if (role === "SUPER_ADMIN") {
      return session;
    }

    const hasPermission = checkPermission(session, required);

    if (!hasPermission) {
      const requiredStr = Array.isArray(required)
        ? required.join(", ")
        : required || "(none)";

      throw new Error(
        `Forbidden: Insufficient permissions. Required: ${requiredStr}, Role: ${role}`
      );
    }

    return session;
  }
);

// ============================================================
// 7. التحقق من الصلاحيات للـ API
// ============================================================

export const requirePermissionForAPI = cache(
  async (required?: string | string[]): Promise<NextResponse | null> => {
    try {
      const session = await getAuthenticatedSession();

      const role = session.role || "USER";

      if (role === "SUPER_ADMIN") {
        return null;
      }

      const hasPermission = checkPermission(session, required);

      if (!hasPermission) {
        const requiredStr = Array.isArray(required)
          ? required.join(", ")
          : required || "(none)";

        return NextResponse.json(
          {
            error: "Forbidden: Insufficient permissions",
            required: requiredStr,
            role,
          },
          { status: 403 }
        );
      }

      return null;
    } catch {
      return NextResponse.json(
        {
          error: "Unauthorized: No session found",
        },
        {
          status: 401,
        }
      );
    }
  }
);

// ============================================================
// 8. فلتر الفروع
// ============================================================

export type BranchFilter = {
  branchId?: string | { in: string[] };
};

export const getBranchFilter = (
  session: AuthSession | null
): BranchFilter => {
  if (!session) {
    return {};
  }

  const role = session.role || "USER";

  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    return {};
  }

  if (session.branchId) {
    return {
      branchId: session.branchId,
    };
  }

  if (session.branchIds?.length) {
    return {
      branchId: {
        in: session.branchIds,
      },
    };
  }

  return {};
};