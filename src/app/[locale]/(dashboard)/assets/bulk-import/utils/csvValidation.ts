import { z } from 'zod';
import { AssetRowSchema, BulkAssetRow } from '../types/bulkImport.types';

export function validateCSVRow(row: any): { valid: boolean; errors?: string[]; data?: BulkAssetRow } {
  const result = AssetRowSchema.safeParse(row);
  
  if (result.success) {
    return {
      valid: true,
      data: {
        id: crypto.randomUUID(),
        ...result.data,
      },
    };
  } else {
    // التوافق مع إصدارات Zod المختلفة
    const zodError = result.error;
    let errorMessages: string[] = [];
    
    if ('issues' in zodError && Array.isArray(zodError.issues)) {
      errorMessages = zodError.issues.map((err: any) => err.message);
    } else if ('errors' in zodError && Array.isArray((zodError as any).errors)) {
      errorMessages = (zodError as any).errors.map((err: any) => err.message);
    } else {
      errorMessages = ['Invalid row data'];
    }
    
    return { valid: false, errors: errorMessages };
  }
}