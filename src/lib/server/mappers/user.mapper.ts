import type { UserWithRelations } from '@/lib/server/repositories/user.repository';
import type { User } from '@/app/[locale]/(dashboard)/users/types';

export function mapUserToView(user: UserWithRelations): User {
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