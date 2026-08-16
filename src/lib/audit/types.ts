// src/lib/audit/types.ts

export type AuditEntityType = 
  | 'ASSET'
  | 'WORK_ORDER'
  | 'TICKET'
  | 'CHECKLIST'
  | 'INSPECTION'
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

  COMPLETE = 'COMPLETE',

  RESULT_CHANGE = 'RESULT_CHANGE',

  FINDING_CREATED = 'FINDING_CREATED',

  FINDING_DELETED = 'FINDING_DELETED',
}

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditLogData {
  entityType: AuditEntityType;
  entityId: string;

  action: AuditAction;

  userId: string;
  userEmail: string;

  companyId?: string;
  branchId?: string | null;

  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;

  changes?: AuditChange[];

  metadata?: Record<string, unknown>;
}