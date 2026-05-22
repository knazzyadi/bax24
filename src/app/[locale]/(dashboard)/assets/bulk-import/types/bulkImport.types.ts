import { z } from 'zod';

export const AssetRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameEn: z.string().optional(),
  typeId: z.string().min(1, 'Type ID is required'),
  statusId: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyEnd: z.string().optional(),
  lastMaintenanceDate: z.string().optional(),
  notes: z.string().optional(),
});

export type BulkAssetRow = z.infer<typeof AssetRowSchema> & {
  id: string; // local id for React keys
};

export type ValidatedRow = {
  row: BulkAssetRow;
  errors?: string[];
};