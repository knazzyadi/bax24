// src/app/[locale]/(dashboard)/locations/buildings/building.schema.ts
import { z } from 'zod';

export const buildingSchema = z.object({
  name: z.string().min(1, 'الاسم بالعربية مطلوب'),
  nameEn: z.string().optional(),
  code: z.string().min(1, 'الكود مطلوب'),
  order: z.coerce.number().default(0),
  branchId: z.string().optional(),
});

// ✅ نوع الإدخال (الذي يستخدمه react-hook-form مع coerce)
export type BuildingFormInput = z.input<typeof buildingSchema>;
// ✅ نوع الإخراج (بعد التحقق، order إجباري)
export type BuildingFormValues = z.output<typeof buildingSchema>;