// src/app/[locale]/(super-admin)/super-admin/users/hooks/useUsers.ts

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { User, Company, Role, UserFormData, UserFilters } from '../types';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    companyId: '',
  });

  // جلب المستخدمين مع الفلاتر
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.companyId) params.append('companyId', filters.companyId);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error('تعذر تحميل المستخدمين');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // جلب الشركات والأدوار
  const loadMeta = useCallback(async () => {
    try {
      const [companiesRes, rolesRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/admin/setup-roles'),
      ]);
      if (companiesRes.ok) setCompanies(await companiesRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
    } catch (error) {
      console.error('Error loading meta:', error);
    }
  }, []);

  // تهيئة البيانات مع إمكانية الإلغاء لتجنب تحذير set-state-in-effect
  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      if (cancelled) return;

      await Promise.all([
        loadUsers(),
        loadMeta(),
      ]);
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [loadUsers, loadMeta]);

  // تحديث الفلاتر وإعادة التحميل
  const updateFilters = useCallback((newFilters: Partial<UserFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // إنشاء مستخدم جديد (إرسال دعوة)
  const createUser = useCallback(async (data: UserFormData) => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل إرسال الدعوة');
      }
      toast.success('تم إرسال الدعوة بنجاح');
      await loadUsers();
      return true;
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'حدث خطأ غير متوقع'
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [loadUsers]);

  // تحديث مستخدم
  const updateUser = useCallback(async (id: string, data: UserFormData) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل التحديث');
      }
      toast.success('تم تحديث المستخدم بنجاح');
      await loadUsers();
      return true;
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'حدث خطأ غير متوقع'
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [loadUsers]);

  // تبديل حالة المستخدم (تفعيل/تعطيل)
  const toggleUserStatus = useCallback(async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: !currentStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل تغيير الحالة');
      }
      toast.success(`تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} المستخدم`);
      await loadUsers();
      return true;
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'حدث خطأ غير متوقع'
      );
      return false;
    }
  }, [loadUsers]);

  // إعادة إرسال الدعوة
  const resendInvite = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}/resend-invite`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل إعادة الإرسال');
      }
      toast.success('تم إعادة إرسال الدعوة بنجاح');
      return true;
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'حدث خطأ غير متوقع'
      );
      return false;
    }
  }, []);

  // حذف مستخدم
  const deleteUser = useCallback(async (id: string) => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل الحذف');
      }
      toast.success('تم حذف المستخدم بنجاح');
      await loadUsers();
      return true;
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'حدث خطأ غير متوقع'
      );
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [loadUsers]);

  return {
    users,
    companies,
    roles,
    isLoading,
    isSaving,
    isDeleting,
    filters,
    updateFilters,
    createUser,
    updateUser,
    toggleUserStatus,
    resendInvite,
    deleteUser,
    loadUsers,
  };
}