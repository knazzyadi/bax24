// src/lib/server/validators/user.validator.ts

import { CreateUserSchema, UpdateUserSchema } from '@/lib/server/dto/user.dto';

export class UserValidator {
  static validateCreate(data: unknown) {
    return CreateUserSchema.safeParse(data);
  }

  static validateUpdate(data: unknown) {
    return UpdateUserSchema.safeParse(data);
  }
}