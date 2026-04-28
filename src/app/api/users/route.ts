import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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

    if (role) {
      where.role = {
        name: role,
      };
    }

    if (companyId) {
      where.companyId = companyId;
    }

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
            id: true,
            name: true,
            label: true,
          },
        },
        company: {
          select: {
            id: true,
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
        role: user.role,
        company: user.company,
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