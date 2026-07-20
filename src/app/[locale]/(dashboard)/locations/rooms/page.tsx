// src/app/[locale]/(dashboard)/locations/rooms/page.tsx

import { redirect } from 'next/navigation';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import RoomsClient from './RoomsClient';

interface Room {
  id: string;
  name: string;
  nameEn: string | null;
  code: string;
  order: number;
  floorId: string;
  floor: {
    id: string;
    name: string;
    nameEn: string | null;
    building: {
      id: string;
      name: string;
      nameEn: string | null;
    };
  };
}

interface Floor {
  id: string;
  name: string;
  nameEn: string | null;
  buildingId: string;
  building: {
    id: string;
    name: string;
  };
}

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // ✅ استخدام الجلسة الموحدة
  const session = await getAuthenticatedSession();

  // ✅ التحقق من الدور
  const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden: You do not have permission to access this page.');
  }

  // ✅ استخراج companyId (مضمون)
  const companyId = session.companyId!;
  if (!companyId) {
    throw new Error('Company ID is missing');
  }

  // ✅ جلب الغرف مع الأدوار والمباني
  const rooms = await prisma.room.findMany({
    where: {
      building: {
        companyId: companyId,
        deletedAt: null,
      },
    },
    include: {
      floor: {
        include: {
          building: {
            select: {
              id: true,
              name: true,
              nameEn: true,
            },
          },
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  });

  // ✅ جلب الأدوار لعرضها في الفورم
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
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  // ✅ تحويل البيانات
  const transformedRooms: Room[] = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    nameEn: room.nameEn,
    code: room.code,
    order: room.order,
    floorId: room.floorId,
    floor: {
      id: room.floor.id,
      name: room.floor.name,
      nameEn: room.floor.nameEn,
      building: {
        id: room.floor.building.id,
        name: room.floor.building.name,
        nameEn: room.floor.building.nameEn,
      },
    },
  }));

  const transformedFloors: Floor[] = floors.map((floor) => ({
    id: floor.id,
    name: floor.name,
    nameEn: floor.nameEn,
    buildingId: floor.buildingId,
    building: {
      id: floor.building.id,
      name: floor.building.name,
    },
  }));

  return (
    <RoomsClient
      initialRooms={transformedRooms}
      initialFloors={transformedFloors}
      locale={locale}
    />
  );
}