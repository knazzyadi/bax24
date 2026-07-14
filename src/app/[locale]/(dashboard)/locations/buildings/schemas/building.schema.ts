// src/app/[locale]/(dashboard)/locations/buildings/schemas/building.schema.ts
import { z } from 'zod';

export const buildingSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  nameEn: z.string().optional(),
  code: z.string().min(1, 'الكود مطلوب'),
  order: z.coerce.number().min(0, 'الترتيب يجب أن يكون 0 أو أكثر'),
  branchId: z.string().optional(),
});

export type BuildingFormValues = z.infer<typeof buildingSchema>;