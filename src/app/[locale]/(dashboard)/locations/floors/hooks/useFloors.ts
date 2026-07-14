// src/app/[locale]/(dashboard)/locations/floors/hooks/useFloors.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Floor, Building, FloorFormData, FloorFilters } from '../types';
import { FloorService } from '../services/FloorService';

export function useFloors(initialFloors: Floor[], initialBuildings: Building[]) {
  const [floors, setFloors] = useState<Floor[]>(initialFloors);
  const [buildings] = useState<Building[]>(initialBuildings);
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
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createFloor = useCallback(async (data: FloorFormData) => {
    setIsSaving(true);
    try {
      await FloorService.create(data);
      toast.success('تم إضافة الدور بنجاح');
      await refreshFloors();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [refreshFloors]);

  const updateFloor = useCallback(async (id: string, data: FloorFormData) => {
    setIsSaving(true);
    try {
      await FloorService.update(id, data);
      toast.success('تم تحديث الدور بنجاح');
      await refreshFloors();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [refreshFloors]);

  const deleteFloor = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      await FloorService.delete(id);
      toast.success('تم حذف الدور بنجاح');
      await refreshFloors();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [refreshFloors]);

  const updateFilters = useCallback((newFilters: Partial<FloorFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const filteredFloors = useMemo(() => {
    let result = [...floors];

    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      result = result.filter((f) =>
        f.name.toLowerCase().includes(query) ||
        (f.nameEn?.toLowerCase() || '').includes(query) ||
        f.code.toLowerCase().includes(query)
      );
    }

    if (filters.buildingId) {
      result = result.filter((f) => f.buildingId === filters.buildingId);
    }

    const { sortBy, sortOrder } = filters;
    result.sort((a, b) => {
      let aVal: any = a[sortBy as keyof Floor];
      let bVal: any = b[sortBy as keyof Floor];

      if (sortBy === 'buildingId') {
        aVal = a.building.name;
        bVal = b.building.name;
      }

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
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