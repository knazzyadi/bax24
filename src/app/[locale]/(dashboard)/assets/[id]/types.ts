// src/app/[locale]/(dashboard)/assets/[id]/types.ts

export interface LocalizedEntity {
  id: string;
  name: string;
  nameEn?: string;
}

export interface CodeEntity extends LocalizedEntity {
  code?: string;
}

export interface Status extends LocalizedEntity {
  color?: string;
}

export type Branch = CodeEntity;

export interface Building extends CodeEntity {
  branch?: Branch;
}

export interface Floor extends CodeEntity {
  building?: Building;
}

export interface Room extends CodeEntity {
  floor?: Floor;
}

export interface AssetDetail {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  type?: LocalizedEntity;
  status?: Status;
  purchaseDate?: string;
  operationDate?: string;
  warrantyEnd?: string;
  lastMaintenanceDate?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierNameEn?: string | null;
  notes?: string;
  room?: Room;
}

export interface WorkOrder {
  id: string;
  title: string;
  createdAt: string;
  status: Status;
  priority: LocalizedEntity;
}

export interface MaintenanceRecord {
  id: string;
  scheduleName: string;
  executedAt: string;
  workOrderCode?: string;
  notes?: string;
}