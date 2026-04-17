import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params; // ✅ استخدام await
    const body = await request.json();
    const { status } = body;

    if (typeof status !== 'boolean') {
      return NextResponse.json(
        { error: 'قيمة الحالة يجب أن تكون true أو false' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('UPDATE_USER_ERROR:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث المستخدم' },
      { status: 500 }
    );
  }
}