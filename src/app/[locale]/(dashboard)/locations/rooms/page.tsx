// src/app/[locale]/(dashboard)/locations/rooms/page.tsx
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/authz';
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

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // ✅ التحقق من الصلاحية في الخادم (يسمح بـ ADMIN و SUPER_ADMIN)
  const session = await requireRole(['ADMIN', 'SUPER_ADMIN']);

  const companyId = session.user.companyId;
  if (!companyId) {
    throw new Error('Company ID is missing');
  }

  // ✅ جلب الغرف مع الأدوار والمباني المرتبطة بها
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

  // ✅ جلب الأدوار لعرضها في الفورم (مع المباني)
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

  // ✅ تحويل البيانات للشكل المطلوب
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

  const transformedFloors = floors.map((floor) => ({
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