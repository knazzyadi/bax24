// src/app/[locale]/(dashboard)/locations/rooms/types.ts

export interface Building {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string;
}

export interface Floor {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string;
  buildingId: string;
  building?: Building;
}

export interface Room {
  id: string;
  name: string;
  nameEn?: string | null;
  code: string;
  order: number;
  floorId: string;
  floor?: {
    id: string;
    name: string;
    nameEn?: string | null;
    code?: string;
    building?: {
      id: string;
      name: string;
      nameEn?: string | null;
      code?: string;
    };
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

// ✅ التعديل الجوهري هنا
export interface RoomFilters {
  search: string;
  floorId: string;
  buildingId: string; // ✅ أضفناها
  sortBy:
    | 'name'
    | 'code'
    | 'order'
    | 'createdAt'
    | 'floorId'; // ✅ أضفنا floorId كخيار للفرز
  sortOrder: 'asc' | 'desc';
}