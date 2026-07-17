// src/app/[locale]/(dashboard)/locations/rooms/schemas/room.schema.ts
import { z } from 'zod';

export const roomSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  nameEn: z.string().optional(),
  code: z.string().min(1, 'الكود مطلوب'),
  order: z.number().min(0, 'الترتيب يجب أن يكون 0 أو أكثر'), // ✅ بدون coerce
  floorId: z.string().min(1, 'الدور مطلوب'),
  buildingId: z.string().min(1, 'المبنى مطلوب'),
});

export type RoomFormValues = z.infer<typeof roomSchema>;