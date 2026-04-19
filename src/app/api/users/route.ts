import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const role = searchParams.get('role') || undefined;
    const companyId = searchParams.get('companyId') || undefined;
    const search = searchParams.get('search') || undefined;

    const where: any = {};

    // فلترة الدور (correct relation filtering)
    if (role) {
      where.role = {
        name: role,
      };
    }

    // فلترة الشركة
    if (companyId) {
      where.companyId = companyId;
    }

    // البحث
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,

        role: {
          select: {
            id: true,   // ✅ تمت إضافة id
            name: true,
            label: true,
          },
        },

        company: {
          select: {
            id: true,   // ✅ تمت إضافة id
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,        // الآن يحتوي على id, name, label
        company: user.company,  // الآن يحتوي على id, name
        status: user.status,
        createdAt: user.createdAt,
      }))
    );
  } catch (error) {
    console.error('GET_USERS_ERROR:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}