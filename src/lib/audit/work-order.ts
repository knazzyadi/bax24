// src/lib/audit/work-order.ts

import { AuditAction } from './types';
import { createAuditLog } from './service';
import { diffObjects } from './diff';

type WorkOrderEntity = {
  id: string;
  code?: string;
  title?: string;
  description?: string;
  notes?: string;
  reason?: string;

  workOrderType?: {
    name?: string;
    nameEn?: string;
  } | null;

  priority?: {
    name?: string;
    nameEn?: string;
  } | null;

  status?: {
    name?: string;
    nameEn?: string;
  } | null;

  room?: {
    name?: string;
    nameEn?: string;
  } | null;

  assignedUser?: {
    name?: string;
  } | null;

  createdByUser?: {
    name?: string;
  } | null;
};

export interface WorkOrderDTO {
  id: string;
  code?: string;
  title?: string;
  description?: string;
  typeName?: string;
  typeNameEn?: string;
  priorityName?: string;
  priorityNameEn?: string;
  statusName?: string;
  statusNameEn?: string;
  roomName?: string;
  roomNameEn?: string;
  assignedToName?: string;
  createdByName?: string;
  notes?: string;
  reason?: string;
}

export function buildWorkOrderDTO(
  wo: WorkOrderEntity | null
  ): WorkOrderDTO {
    if (!wo) {
      return {
        id: '',
      };
    }

    return {
    id: wo.id,
    code: wo.code,
    title: wo.title,
    description: wo.description || undefined,
    typeName: wo.workOrderType?.name,
    typeNameEn: wo.workOrderType?.nameEn,
    priorityName: wo.priority?.name,
    priorityNameEn: wo.priority?.nameEn,
    statusName: wo.status?.name,
    statusNameEn: wo.status?.nameEn,
    roomName: wo.room?.name,
    roomNameEn: wo.room?.nameEn,
    assignedToName: wo.assignedUser?.name,
    createdByName: wo.createdByUser?.name,
    notes: wo.notes || undefined,
    reason: wo.reason || undefined,
  };
}

export async function createWorkOrderAudit(
  action: AuditAction,
  workOrderId: string,
  userId: string,
  userEmail: string,
  oldWorkOrder?: WorkOrderEntity | null,
  newWorkOrder?: WorkOrderEntity | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  const oldDTO = oldWorkOrder
    ? buildWorkOrderDTO(oldWorkOrder)
    : { id: workOrderId };

  const newDTO = buildWorkOrderDTO(
    newWorkOrder ?? { id: workOrderId }
  );

  const finalAction = oldDTO
    ? action
    : AuditAction.CREATE;

  const changes = diffObjects(oldDTO, newDTO);

  if (
    changes.length === 0 &&
    finalAction !== AuditAction.CREATE &&
    finalAction !== AuditAction.DELETE
  ) {
    console.log(
      '📝 No changes detected, skipping work order audit log'
    );

    return;
  }

  await createAuditLog({
    entityType: 'WORK_ORDER',
    entityId: workOrderId,
    action: finalAction,
    userId,
    userEmail,
    changes,
    metadata: metadata ?? {
      old: oldDTO,
      new: newDTO,
    },
  });
}