// src/lib/audit/diff.ts
import { AuditChange } from './types';

/**
 * Compare two objects and return list of changes
 * Only compares specified fields (or all if none specified)
 */
export function diffObjects<T extends object>(
  oldObj: T | null | undefined,
  newObj: T,
  fieldsToCompare?: (keyof T)[]
): AuditChange[] {
  const changes: AuditChange[] = [];

  if (!oldObj) {
    // If no old object, all fields are considered new
    for (const key of Object.keys(newObj) as (keyof T)[]) {
      changes.push({
        field: key as string,
        oldValue: undefined,
        newValue: newObj[key],
      });
    }
    return changes;
  }

  const keys = (fieldsToCompare || Object.keys(newObj)) as (keyof T)[];
  for (const key of keys) {
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    // Normalize null/undefined
    const normalizedOld = oldVal === null || oldVal === undefined ? undefined : oldVal;
    const normalizedNew = newVal === null || newVal === undefined ? undefined : newVal;

    if (normalizedOld !== normalizedNew) {
      changes.push({
        field: key as string,
        oldValue: normalizedOld,
        newValue: normalizedNew,
      });
    }
  }

  return changes;
}

/**
 * Convert changes to string values for database storage
 */
export function changesToDb(changes: AuditChange[]) {
  if (changes.length === 0) return null;
  // For backward compatibility, if only one change, store in field/oldValue/newValue
  if (changes.length === 1) {
    return {
      field: changes[0].field,
      oldValue: changes[0].oldValue !== undefined ? String(changes[0].oldValue) : null,
      newValue: changes[0].newValue !== undefined ? String(changes[0].newValue) : null,
    };
  }
  // For multiple changes, store as JSON in changes field
  return {
    field: null,
    oldValue: null,
    newValue: null,
    changes: changes,
  };
}