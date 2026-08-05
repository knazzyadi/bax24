// src/app/[locale]/(dashboard)/locations/floors/hooks/useFloors.ts

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import type {
  Floor,
  Building,
  FloorFormData,
  FloorFilters,
} from './types';

import { FloorService } from '@/lib/services/locations/floors.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'حدث خطأ غير معروف';
}

export function useFloors(
  initialFloors: Floor[],
  initialBuildings: Building[]
) {
  const [floors, setFloors] = useState<Floor[]>(initialFloors);

  // لا حاجة إلى useState هنا
  const buildings = initialBuildings;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState<FloorFilters>({
    search: '',
    buildingId: '',
    sortBy: 'order',
    sortOrder: 'asc',
  });

  const refreshFloors = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await FloorService.getAll();
      setFloors(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createFloor = useCallback(
    async (data: FloorFormData) => {
      setIsSaving(true);

      try {
        await FloorService.create(data);

        toast.success('تم إضافة الدور بنجاح');

        await refreshFloors();

        return true;
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));

        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [refreshFloors]
  );

  const updateFloor = useCallback(
    async (id: string, data: FloorFormData) => {
      setIsSaving(true);

      try {
        await FloorService.update(id, data);

        toast.success('تم تحديث الدور بنجاح');

        await refreshFloors();

        return true;
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));

        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [refreshFloors]
  );

  const deleteFloor = useCallback(
    async (id: string) => {
      setIsDeleting(true);

      try {
        await FloorService.delete(id);

        toast.success('تم حذف الدور بنجاح');

        await refreshFloors();

        return true;
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));

        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [refreshFloors]
  );

  const updateFilters = useCallback(
    (newFilters: Partial<FloorFilters>) => {
      setFilters((prev) => ({
        ...prev,
        ...newFilters,
      }));
    },
    []
  );

  const filteredFloors = useMemo(() => {
    let result = [...floors];

    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();

      result = result.filter(
        (floor) =>
          floor.name.toLowerCase().includes(query) ||
          (floor.nameEn?.toLowerCase() ?? '').includes(query) ||
          floor.code.toLowerCase().includes(query)
      );
    }

    if (filters.buildingId) {
      result = result.filter(
        (floor) => floor.buildingId === filters.buildingId
      );
    }

    const { sortBy, sortOrder } = filters;

    result.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      if (sortBy === 'buildingId') {
        aVal = a.building?.name ?? '';
        bVal = b.building?.name ?? '';
      } else {
        const valueA = a[sortBy as keyof Floor];
        const valueB = b[sortBy as keyof Floor];

        aVal =
          typeof valueA === 'number' || typeof valueA === 'string'
            ? valueA
            : '';

        bVal =
          typeof valueB === 'number' || typeof valueB === 'string'
            ? valueB
            : '';
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc'
        ? Number(aVal) - Number(bVal)
        : Number(bVal) - Number(aVal);
    });

    return result;
  }, [floors, filters]);

  return {
    floors: filteredFloors,
    allFloors: floors,
    buildings,
    isLoading,
    isSaving,
    isDeleting,
    filters,
    updateFilters,
    createFloor,
    updateFloor,
    deleteFloor,
    refreshFloors,
  };
}