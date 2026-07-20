// src/app/[locale]/(dashboard)/locations/buildings/building.schema.ts
import { z } from 'zod';

export const buildingSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  nameEn: z.string().optional(),
  code: z.string().min(1, 'الكود مطلوب'),
  order: z.number().min(0).optional(), // ✅ إزالة .default(0)
  branchId: z.string().optional(),
});

// يمكنك أيضاً تصدير النوع مباشرة باستخدام z.infer
export type BuildingFormValues = z.infer<typeof buildingSchema>;