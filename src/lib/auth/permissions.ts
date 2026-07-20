// src/lib/auth/permissions.ts

// ============================================================
// 1. استيراد الأنواع من auth-helper
// ============================================================
import type { AuthSession } from "@/lib/auth/auth-helper";

// ============================================================
// 2. تعريف صلاحيات كل دور (مثل السابق)
// ============================================================
const rolePermissions: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: ["*"],
  BRANCH_MANAGER: [
    "assets.read",
    "assets.create",
    "assets.edit",
    "assets.update",
    "assets.delete",
    "work_orders.read",
    "work_orders.create",
    "work_orders.edit",
    "work_orders.update",
    "work_orders.delete",
    "work_orders.execute",
    "tickets.read",
    "tickets.create",
    "tickets.update",
    "tickets.delete",
    "users.read",
    "reports.view",
    "dashboard.view",
    "contracts.read",
    "contracts.create",
    "contracts.edit",
    "contracts.update",
    "contracts.delete",
    "maintenance.read",
    "maintenance.create",
    "maintenance.update",
    "maintenance.delete",
    "maintenance.execute",
  ],
  TECH: [
    "assets.read",
    "work_orders.read",
    "work_orders.execute",
    "tickets.read",
    "maintenance.read",
  ],
  USER: [
    "assets.read",
    "work_orders.read",
    "tickets.read",
  ],
};

// ============================================================
// 3. دوال مساعدة (مثل السابق)
// ============================================================
export const getUserPermissionsFromRole = (role: string): string[] => {
  return rolePermissions[role] || [];
};

export const hasPermission = (role: string, permission: string): boolean => {
  const permissions = getUserPermissionsFromRole(role);
  return permissions.includes("*") || permissions.includes(permission);
};

export const getRolesWithPermission = (permission: string): string[] => {
  return Object.keys(rolePermissions).filter((role) =>
    hasPermission(role, permission)
  );
};

export const getRolePermissions = (): Record<string, string[]> => {
  return { ...rolePermissions };
};

export const addPermissionToRole = (role: string, permission: string): void => {
  if (!rolePermissions[role]) {
    rolePermissions[role] = [];
  }
  if (!rolePermissions[role].includes(permission)) {
    rolePermissions[role].push(permission);
  }
};

export const removePermissionFromRole = (role: string, permission: string): void => {
  if (rolePermissions[role]) {
    rolePermissions[role] = rolePermissions[role].filter((p) => p !== permission);
  }
};

// ============================================================
// 4. دوال الحماية (المطورة - تستقبل الجلسة)
// ============================================================

import { NextResponse } from "next/server";

/**
 * التحقق من أن المستخدم لديه صلاحية معينة
 * @param session - جلسة المستخدم (يتم جلبها مرة واحدة في الـ Route)
 * @param permission - اسم الصلاحية المطلوبة
 * @returns NextResponse إذا كان غير مصرح، أو null إذا كان مصرحاً
 */
export function requirePermission(
  session: AuthSession,
  permission: string
): NextResponse | null {
  const userRole = session.role;

  if (!userRole) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid user role" },
      { status: 401 }
    );
  }

  if (!hasPermission(userRole, permission)) {
    return NextResponse.json(
      { error: `Forbidden: Missing required permission (${permission})` },
      { status: 403 }
    );
  }

  return null; // ✅ مصرح
}

/**
 * التحقق من أن المستخدم هو SUPER_ADMIN
 */
export function requireSuperAdmin(session: AuthSession): NextResponse | null {
  if (session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Super Admin only" },
      { status: 403 }
    );
  }
  return null;
}

/**
 * التحقق من أن المستخدم هو ADMIN أو SUPER_ADMIN
 */
export function requireAdmin(session: AuthSession): NextResponse | null {
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Admin only" },
      { status: 403 }
    );
  }
  return null;
}