// src/app/[locale]/(dashboard)/locations/buildings/useBuildings.ts
import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { Building, Branch, BuildingFormData, BuildingFilters } from './types';
import { BuildingService } from '@/lib/services/locations/buildings.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'حدث خطأ غير معروف';
}

export function useBuildings(initialBuildings: Building[], initialBranches: Branch[]) {
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const branches = initialBranches;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState<BuildingFilters>({
    search: '',
    branchId: '',
    sortBy: 'order',
    sortOrder: 'asc',
  });

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await BuildingService.getAll();
      setBuildings(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBuilding = useCallback(async (data: BuildingFormData) => {
    setIsSaving(true);
    try {
      await BuildingService.create(data);
      toast.success('تم إضافة المبنى بنجاح');
      await refetch();
      return true;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [refetch]);

  const updateBuilding = useCallback(async (id: string, data: BuildingFormData) => {
    setIsSaving(true);
    try {
      await BuildingService.update(id, data);
      toast.success('تم تحديث المبنى بنجاح');
      await refetch();
      return true;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [refetch]);

  const deleteBuilding = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      await BuildingService.delete(id);
      toast.success('تم حذف المبنى بنجاح');
      await refetch();
      return true;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [refetch]);

  const updateFilters = useCallback((newFilters: Partial<BuildingFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const filteredBuildings = useMemo(() => {
    let result = [...buildings];

    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      result = result.filter((b) =>
        b.name.toLowerCase().includes(query) ||
        (b.nameEn?.toLowerCase() || '').includes(query) ||
        b.code.toLowerCase().includes(query)
      );
    }

    if (filters.branchId) {
      result = result.filter((b) => b.branchId === filters.branchId);
    }

    const { sortBy, sortOrder } = filters;
    result.sort((a, b) => {
      let aVal = a[sortBy as keyof Building];
      let bVal = b[sortBy as keyof Building];

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      const aNum = Number(aVal);
      const bNum = Number(bVal);
      return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
    });

    return result;
  }, [buildings, filters]);

  return {
    buildings: filteredBuildings,
    allBuildings: buildings,
    branches,
    isLoading,
    isSaving,
    isDeleting,
    filters,
    updateFilters,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    refetch,
  };
}