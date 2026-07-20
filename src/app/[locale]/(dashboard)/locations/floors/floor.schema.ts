// src/app/[locale]/(dashboard)/locations/floors/floor.schema.ts
import { z } from 'zod';

export const floorSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  nameEn: z.string().optional(),
  code: z.string().min(1, 'الكود مطلوب'),
  order: z.number().min(0, 'الترتيب يجب أن يكون 0 أو أكثر'),
  buildingId: z.string().min(1, 'المبنى مطلوب'),
});

export type FloorFormValues = z.infer<typeof floorSchema>;