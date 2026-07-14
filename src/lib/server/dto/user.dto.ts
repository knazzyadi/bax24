import { z } from 'zod';

// Zod schemas for validation
export const CreateUserSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  roleId: z.string().min(1, 'الدور مطلوب'),
  branchIds: z.array(z.string()).default([]),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;