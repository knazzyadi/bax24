// src/app/[locale]/(super-admin)/super-admin/branches/hooks/useBranches.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Branch, Company, BranchFormData } from '../types';

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [branchesRes, companiesRes] = await Promise.all([
        fetch('/api/branches'),
        fetch('/api/companies'),
      ]);

      if (!branchesRes.ok) throw new Error();
      if (!companiesRes.ok) throw new Error();

      setBranches(await branchesRes.json());
      setCompanies(await companiesRes.json());
    } catch {
      toast.error('تعذر تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createBranch = useCallback(async (data: BranchFormData) => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل الإضافة');
      }
      toast.success('تم إضافة الفرع بنجاح');
      await loadData();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [loadData]);

  const updateBranch = useCallback(async (id: string, data: BranchFormData) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/branches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل التحديث');
      }
      toast.success('تم تحديث الفرع بنجاح');
      await loadData();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [loadData]);

  const deleteBranch = useCallback(async (id: string) => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل الحذف');
      }
      toast.success('تم حذف الفرع بنجاح');
      await loadData();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [loadData]);

  return {
    branches,
    companies,
    isLoading,
    isSaving,
    isDeleting,
    loadData,
    createBranch,
    updateBranch,
    deleteBranch,
  };
}