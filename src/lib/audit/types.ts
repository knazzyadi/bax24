// src/lib/audit/types.ts
export type AuditEntityType = 
  | 'ASSET'
  | 'WORK_ORDER'
  | 'TICKET'
  | 'CHECKLIST'
  | 'PM'
  | 'INVENTORY'
  | 'CONTRACT'
  | 'USER'
  | 'SETTINGS';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  LOCATION_CHANGE = 'LOCATION_CHANGE',
  SERIAL_CHANGE = 'SERIAL_CHANGE',
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface AuditLogData {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  userId: string;
  userEmail: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  changes?: AuditChange[];
  metadata?: Record<string, any>;
}