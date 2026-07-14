// src/app/[locale]/(dashboard)/locations/rooms/types.ts

export interface Room {
  id: string;
  name: string;
  nameEn: string | null;
  code: string;
  order: number;
  floorId: string;
  floor: {
    id: string;
    name: string;
    nameEn: string | null;
    building: {
      id: string;
      name: string;
      nameEn: string | null;
    };
  };
}

export interface Floor {
  id: string;
  name: string;
  nameEn: string | null;
  buildingId: string;
  building: {
    id: string;
    name: string;
  };
}

export interface RoomFormData {
  name: string;
  nameEn: string;
  code: string;
  order: number;
  floorId: string;
  buildingId: string;
}

export interface RoomFilters {
  search: string;
  floorId: string;
  buildingId: string;
  sortBy: 'name' | 'code' | 'order' | 'floorId';
  sortOrder: 'asc' | 'desc';
}