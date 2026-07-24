// src/app/[locale]/(dashboard)/locations/rooms/page.tsx
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import RoomsClient from './RoomsClient';
import type { Room, Floor } from './types';

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const session = await getAuthenticatedSession();

  const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden: You do not have permission to access this page.');
  }

  const companyId = session.companyId!;
  if (!companyId) {
    throw new Error('Company ID is missing');
  }

  const rooms = await prisma.room.findMany({
    where: {
      floor: {
        building: {
          companyId: companyId,
          deletedAt: null,
        },
      },
      deletedAt: null,
    },
    include: {
      floor: {
        include: {
          building: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              code: true,
            },
          },
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  });

  const floors = await prisma.floor.findMany({
    where: {
      building: {
        companyId: companyId,
        deletedAt: null,
      },
    },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          code: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  const transformedRooms: Room[] = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    nameEn: room.nameEn,
    code: room.code,
    order: room.order,
    floorId: room.floorId,
    floor: room.floor
      ? {
          id: room.floor.id,
          name: room.floor.name,
          nameEn: room.floor.nameEn,
          code: room.floor.code,
          building: room.floor.building
            ? {
                id: room.floor.building.id,
                name: room.floor.building.name,
                nameEn: room.floor.building.nameEn,
                code: room.floor.building.code,
              }
            : undefined,
        }
      : undefined,
  }));

  const transformedFloors: Floor[] = floors.map((floor) => ({
    id: floor.id,
    name: floor.name,
    nameEn: floor.nameEn,
    code: floor.code,
    buildingId: floor.buildingId,
    building: floor.building
      ? {
          id: floor.building.id,
          name: floor.building.name,
          nameEn: floor.building.nameEn,
          code: floor.building.code,
        }
      : undefined,
  }));

  return (
    <RoomsClient
      initialRooms={transformedRooms}
      initialFloors={transformedFloors}
      locale={locale}
    />
  );
}