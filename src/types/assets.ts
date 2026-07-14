// src/types/assets.ts

export interface AssetStatus {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  color?: string | null;
  order?: number;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetType {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  description?: string | null;
  order?: number;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Branch {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  companyId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Building {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  branchId: string;
  branch?: Branch;
  createdAt?: string;
  updatedAt?: string;
}

export interface Floor {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  buildingId: string;
  building?: Building;
  createdAt?: string;
  updatedAt?: string;
}

export interface Room {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  floorId: string;
  floor?: Floor;
  buildingId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  typeId?: string | null;
  type?: AssetType;
  statusId?: string | null;
  status?: AssetStatus;
  roomId?: string | null;
  room?: Room;
  supplierId?: string | null;
  supplier?: Supplier;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  notes?: string | null;
  purchaseDate?: string | null;
  operationDate?: string | null;
  warrantyEnd?: string | null;
  lastMaintenanceDate?: string | null;
  branchId?: string | null;
  buildingId?: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}