'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { UsersApi } from '@/lib/api/users.api';
import type { SharedUser, SharedUserFilters } from '@/lib/shared/types/user';
import type { UserFormData } from '../types';

/**
 * Hook مخصص لإدارة المستخدمين
 * - جلب البيانات مع Pagination و Sorting و Filtering
 * - عمليات CRUD مع Optimistic UI و Rollback
 * - إلغاء الطلبات المعلقة تلقائياً عند تغيير الفلاتر أو إلغاء التحميل
 */
export function useUsers() {
  const { data: session } = useSession();

  // ======================== State ========================
  const [users, setUsers] = useState<SharedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState<SharedUserFilters>({
    search: '',
    roleId: '',
    status: undefined,
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // ======================== Refs ========================
  const controllersRef = useRef<Map<string, AbortController>>(new Map());
  const companyId = session?.user?.companyId;

  // تنظيف الطلبات المعلقة عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      controllersRef.current.forEach((c) => c.abort());
      controllersRef.current.clear();
    };
  }, []);

  // ======================== جلب البيانات ========================
  const fetchUsers = useCallback(async () => {
    // لا تبدأ الطلب إذا لم تكن هناك شركة
    if (!companyId) return;

    // إلغاء الطلب السابق (إن وجد)
    const existingController = controllersRef.current.get('fetch');
    if (existingController) {
      existingController.abort();
      controllersRef.current.delete('fetch');
    }

    // إنشاء طلب جديد
    const controller = new AbortController();
    controllersRef.current.set('fetch', controller);

    setIsLoading(true);

    try {
      const response = await UsersApi.getUsers(filters, controller.signal);
      setUsers(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      // تجاهل أخطاء الإلغاء
      if (error instanceof Error && error.name === 'AbortError') return;

      toast.error(
        error instanceof Error ? error.message : 'فشل تحميل المستخدمين'
      );
    } finally {
      setIsLoading(false);
      controllersRef.current.delete('fetch');
    }
  }, [companyId, filters]);

  // ======================== التأثيرات الجانبية ========================
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ======================== دوال التحكم ========================
  const updateFilters = useCallback((newFilters: Partial<SharedUserFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const changePage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  // ======================== عمليات CRUD مع Optimistic UI ========================

  // إنشاء مستخدم
  const createUser = useCallback(
    async (data: UserFormData) => {
      if (!companyId) return;

      const controller = new AbortController();
      const id = `create-${Date.now()}`;
      controllersRef.current.set(id, controller);
      setIsSaving(true);

      // كائن مؤقت (Optimistic)
      const tempUser: SharedUser = {
        id: `temp-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: { id: data.roleId, name: data.roleId, label: null },
        status: true,
        createdAt: new Date().toISOString(),
        branches: data.branchIds.map((id) => ({ id, name: '' })),
      };

      setUsers((prev) => [tempUser, ...prev]);
      setTotal((prev) => prev + 1);

      try {
        const user = await UsersApi.createUser(data, controller.signal);
        // استبدال الكائن المؤقت بالبيانات الحقيقية
        setUsers((prev) => prev.map((u) => (u.id === tempUser.id ? user : u)));
        toast.success('تم إضافة المستخدم بنجاح');
        return user;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;

        // التراجع (Rollback)
        setUsers((prev) => prev.filter((u) => u.id !== tempUser.id));
        setTotal((prev) => prev - 1);
        toast.error(
          error instanceof Error ? error.message : 'فشل إضافة المستخدم'
        );
        throw error;
      } finally {
        setIsSaving(false);
        controllersRef.current.delete(id);
      }
    },
    [companyId]
  );

  // تحديث مستخدم
  const updateUser = useCallback(
    async (id: string, data: Partial<UserFormData>) => {
      if (!companyId) return;

      const controller = new AbortController();
      const controllerId = `update-${id}`;
      controllersRef.current.set(controllerId, controller);
      setIsSaving(true);

      // تخزين نسخة احتياطية قبل التحديث
      let snapshot: SharedUser | undefined;

      setUsers((prev) => {
        snapshot = prev.find((u) => u.id === id);
        return prev.map((u) =>
          u.id === id
            ? {
                ...u,
                name: data.name || u.name,
                email: data.email || u.email,
              }
            : u
        );
      });

      try {
        const user = await UsersApi.updateUser(id, data, controller.signal);
        setUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
        toast.success('تم تحديث المستخدم بنجاح');
        return user;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;

        // التراجع باستخدام النسخة الاحتياطية
        if (snapshot) {
          setUsers((prev) => prev.map((u) => (u.id === id ? snapshot! : u)));
        }
        toast.error(
          error instanceof Error ? error.message : 'فشل تحديث المستخدم'
        );
        throw error;
      } finally {
        setIsSaving(false);
        controllersRef.current.delete(controllerId);
      }
    },
    [companyId]
  );

  // تبديل حالة المستخدم (تفعيل / تعطيل)
  const toggleUserStatus = useCallback(
    async (id: string) => {
      if (!companyId) return;

      const controller = new AbortController();
      const controllerId = `toggle-${id}`;
      controllersRef.current.set(controllerId, controller);

      let snapshot: SharedUser | undefined;

      // تحديث Optimistic
      setUsers((prev) => {
        snapshot = prev.find((u) => u.id === id);
        return prev.map((u) =>
          u.id === id ? { ...u, status: !u.status } : u
        );
      });

      try {
        const user = await UsersApi.toggleUserStatus(id, controller.signal);
        setUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
        toast.success(user.status ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم');
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;

        // Rollback
        if (snapshot) {
          setUsers((prev) => prev.map((u) => (u.id === id ? snapshot! : u)));
        }
        toast.error(
          error instanceof Error ? error.message : 'فشل تغيير الحالة'
        );
      } finally {
        controllersRef.current.delete(controllerId);
      }
    },
    [companyId]
  );

  // إعادة إرسال الدعوة
  const resendInvite = useCallback(
    async (id: string) => {
      if (!companyId) return;

      const controller = new AbortController();
      const controllerId = `invite-${id}`;
      controllersRef.current.set(controllerId, controller);

      try {
        await UsersApi.resendInvite(id, controller.signal);
        toast.success('تم إعادة إرسال الدعوة بنجاح');
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        toast.error(
          error instanceof Error ? error.message : 'فشل إعادة إرسال الدعوة'
        );
      } finally {
        controllersRef.current.delete(controllerId);
      }
    },
    [companyId]
  );

  // حذف مستخدم
  const deleteUser = useCallback(
    async (id: string) => {
      if (!companyId) return;

      const controller = new AbortController();
      const controllerId = `delete-${id}`;
      controllersRef.current.set(controllerId, controller);
      setIsDeleting(true);

      let snapshot: SharedUser | undefined;

      // حذف Optimistic
      setUsers((prev) => {
        snapshot = prev.find((u) => u.id === id);
        return prev.filter((u) => u.id !== id);
      });
      setTotal((prev) => prev - 1);

      try {
        await UsersApi.deleteUser(id, controller.signal);
        toast.success('تم حذف المستخدم بنجاح');
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;

        // Rollback
        if (snapshot) {
          setUsers((prev) => [...prev, snapshot!]);
          setTotal((prev) => prev + 1);
        }
        toast.error(
          error instanceof Error ? error.message : 'فشل حذف المستخدم'
        );
      } finally {
        setIsDeleting(false);
        controllersRef.current.delete(controllerId);
      }
    },
    [companyId]
  );

  // ======================== القيم المُصدرة ========================
  return {
    // البيانات
    users,
    total,
    totalPages,
    // حالات التحميل
    isLoading,
    isSaving,
    isDeleting,
    // الفلاتر والتحكم فيها
    filters,
    updateFilters,
    changePage,
    // إعادة الجلب
    fetchUsers,
    // عمليات CRUD
    createUser,
    updateUser,
    toggleUserStatus,
    resendInvite,
    deleteUser,
  };
}