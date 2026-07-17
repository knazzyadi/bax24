// src/lib/server/mappers/user.mapper.ts
import type { UserWithRelations } from '@/lib/repositories/user.repository';
import type { User } from '@/app/[locale]/(dashboard)/users/types';

export function mapUserToView(user: UserWithRelations): User {
  if (!user.role) {
    throw new Error('User role is null');
  }
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: {
      id: user.role.id,
      name: user.role.name,
      label: user.role.label,
    },
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    branches: user.userBranches.map((ub) => ({
      id: ub.branch.id,
      name: ub.branch.name,
    })),
  };
}

export function mapUsersToView(users: UserWithRelations[]): User[] {
  return users.map(mapUserToView);
}