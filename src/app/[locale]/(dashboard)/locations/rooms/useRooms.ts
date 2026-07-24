// src/app/[locale]/(dashboard)/locations/rooms/useRooms.ts
import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Room, Floor, RoomFormData, RoomFilters } from './types';
import { RoomService } from '@/lib/services/locations/rooms.service';

export function useRooms(initialRooms: Room[], initialFloors: Floor[]) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [floors] = useState<Floor[]>(initialFloors);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState<RoomFilters>({
    search: '',
    floorId: '',
    buildingId: '',
    sortBy: 'order',
    sortOrder: 'asc',
  });

  const refreshRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await RoomService.getAll();
      setRooms(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRoom = useCallback(async (data: RoomFormData) => {
    setIsSaving(true);
    try {
      await RoomService.create(data);
      toast.success('تم إضافة الغرفة بنجاح');
      await refreshRooms();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [refreshRooms]);

  const updateRoom = useCallback(async (id: string, data: RoomFormData) => {
    setIsSaving(true);
    try {
      await RoomService.update(id, data);
      toast.success('تم تحديث الغرفة بنجاح');
      await refreshRooms();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [refreshRooms]);

  const deleteRoom = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      await RoomService.delete(id);
      toast.success('تم حذف الغرفة بنجاح');
      await refreshRooms();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [refreshRooms]);

  const updateFilters = useCallback((newFilters: Partial<RoomFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const filteredRooms = useMemo(() => {
    let result = [...rooms];

    // البحث
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      result = result.filter((r) =>
        r.name.toLowerCase().includes(query) ||
        (r.nameEn?.toLowerCase() || '').includes(query) ||
        r.code.toLowerCase().includes(query)
      );
    }

    // فلتر حسب الدور
    if (filters.floorId) {
      result = result.filter((r) => r.floorId === filters.floorId);
    }

    // فلتر حسب المبنى
    if (filters.buildingId) {
      result = result.filter((r) => r.floor?.building?.id === filters.buildingId);
    }

    // الترتيب
    const { sortBy, sortOrder } = filters;
    result.sort((a, b) => {
      let aVal: any, bVal: any;

      if (sortBy === 'floorId') {
        aVal = a.floor?.name || '';
        bVal = b.floor?.name || '';
      } else {
        aVal = a[sortBy as keyof Room];
        bVal = b[sortBy as keyof Room];
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
  }, [rooms, filters]);

  // استخراج المباني من الأدوار لعرضها في الفلتر
  const buildings = useMemo(() => {
    const buildingMap = new Map<string, { id: string; name: string; nameEn?: string | null }>();
    floors.forEach((floor) => {
      if (floor.building && !buildingMap.has(floor.building.id)) {
        buildingMap.set(floor.building.id, {
          id: floor.building.id,
          name: floor.building.name,
          nameEn: floor.building.nameEn,
        });
      }
    });
    return Array.from(buildingMap.values());
  }, [floors]);

  return {
    rooms: filteredRooms,
    allRooms: rooms,
    floors,
    buildings,
    isLoading,
    isSaving,
    isDeleting,
    filters,
    updateFilters,
    createRoom,
    updateRoom,
    deleteRoom,
    refreshRooms,
  };
}