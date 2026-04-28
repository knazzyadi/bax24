export interface InventoryItem {
  id: string;
  sku: string | null;
  name: string;
  nameEn: string | null;
  quantity: number;
  minQuantity: number;
  unit: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  room: {
    id: string;
    name: string;
    nameEn: string | null;
    code: string | null;
    floor: {
      id: string;
      name: string;
      nameEn: string | null;
      building: {
        id: string;
        name: string;
        nameEn: string | null;
      } | null;
    } | null;
  } | null;
}