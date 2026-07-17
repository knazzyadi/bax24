// src/app/[locale]/(super-admin)/super-admin/companies/hooks/useCompanies.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Company, CompanyFormData } from './types';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/companies');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      toast.error('تعذر تحميل الشركات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createCompany = useCallback(async (data: CompanyFormData) => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل الإضافة');
      }
      toast.success('تم إضافة الشركة بنجاح');
      await loadData();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [loadData]);

  const updateCompany = useCallback(async (id: string, data: CompanyFormData) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل التحديث');
      }
      toast.success('تم تحديث الشركة بنجاح');
      await loadData();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [loadData]);

  const toggleCompanyStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/companies/${id}/toggle-status`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل تغيير الحالة');
      }
      toast.success('تم تغيير حالة الشركة');
      await loadData();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    }
  }, [loadData]);

  const deleteCompany = useCallback(async (id: string) => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل الحذف');
      }
      toast.success('تم حذف الشركة بنجاح');
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
    companies,
    isLoading,
    isSaving,
    isDeleting,
    loadData,
    createCompany,
    updateCompany,
    toggleCompanyStatus,
    deleteCompany,
  };
}