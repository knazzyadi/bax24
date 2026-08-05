// src/app/[locale]/(dashboard)/locations/rooms/useRooms.ts

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import type {
  Room,
  Floor,
  RoomFormData,
  RoomFilters,
} from './types';

import { RoomService } from '@/lib/services/locations/rooms.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'حدث خطأ غير معروف';
}

export function useRooms(
  initialRooms: Room[],
  initialFloors: Floor[]
) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);

  const floors = initialFloors;

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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRoom = useCallback(
    async (data: RoomFormData) => {
      setIsSaving(true);

      try {
        await RoomService.create(data);

        toast.success('تم إضافة الغرفة بنجاح');

        await refreshRooms();

        return true;
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));

        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [refreshRooms]
  );

  const updateRoom = useCallback(
    async (id: string, data: RoomFormData) => {
      setIsSaving(true);

      try {
        await RoomService.update(id, data);

        toast.success('تم تحديث الغرفة بنجاح');

        await refreshRooms();

        return true;
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));

        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [refreshRooms]
  );

  const deleteRoom = useCallback(
    async (id: string) => {
      setIsDeleting(true);

      try {
        await RoomService.delete(id);

        toast.success('تم حذف الغرفة بنجاح');

        await refreshRooms();

        return true;
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));

        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [refreshRooms]
  );

  const updateFilters = useCallback(
    (newFilters: Partial<RoomFilters>) => {
      setFilters((prev) => ({
        ...prev,
        ...newFilters,
      }));
    },
    []
  );

  const filteredRooms = useMemo(() => {
    let result = [...rooms];

    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();

      result = result.filter(
        (room) =>
          room.name.toLowerCase().includes(query) ||
          (room.nameEn?.toLowerCase() ?? '').includes(query) ||
          room.code.toLowerCase().includes(query)
      );
    }

    if (filters.floorId) {
      result = result.filter(
        (room) => room.floorId === filters.floorId
      );
    }

    if (filters.buildingId) {
      result = result.filter(
        (room) => room.floor?.building?.id === filters.buildingId
      );
    }

    const { sortBy, sortOrder } = filters;

    result.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      if (sortBy === 'floorId') {
        aVal = a.floor?.name ?? '';
        bVal = b.floor?.name ?? '';
      } else {
        const valueA = a[sortBy as keyof Room];
        const valueB = b[sortBy as keyof Room];

        aVal =
          typeof valueA === 'string' || typeof valueA === 'number'
            ? valueA
            : '';

        bVal =
          typeof valueB === 'string' || typeof valueB === 'number'
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
  }, [rooms, filters]);

  const buildings = useMemo(() => {
    const buildingMap = new Map<
      string,
      {
        id: string;
        name: string;
        nameEn?: string | null;
      }
    >();

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