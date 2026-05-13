// src/app/api/branches/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { randomUUID } from 'crypto';

// دالة مساعدة لتوليد slug من النص
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!user) return NextResponse.json({ error: 'مستخدم غير موجود' }, { status: 404 });

    const roleName = user.role?.name;
    const userBranchIds = session.user.branchIds || [];

    if (roleName === 'SUPER_ADMIN') {
      const branches = await prisma.branch.findMany({
        include: { company: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(branches);
    }

    if (user.companyId) {
      let where: any = { companyId: user.companyId };
      const isAdmin = roleName === 'ADMIN';
      if (!isAdmin && userBranchIds.length > 0) {
        where.id = { in: userBranchIds };
      } else if (!isAdmin && userBranchIds.length === 0) {
        return NextResponse.json([]);
      }
      const branches = await prisma.branch.findMany({
        where,
        include: { company: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(branches);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('GET /api/branches error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!user) return NextResponse.json({ error: 'مستخدم غير موجود' }, { status: 404 });

    const roleName = user.role?.name;
    const { name, nameEn, code, companyId } = await request.json();

    if (!name || !code) {
      return NextResponse.json({ error: 'اسم الفرع والكود مطلوبان' }, { status: 400 });
    }

    let targetCompanyId = companyId;
    if (roleName !== 'SUPER_ADMIN') {
      if (!user.companyId) return NextResponse.json({ error: 'الشركة غير محددة' }, { status: 400 });
      targetCompanyId = user.companyId;
    }

    if (!targetCompanyId) {
      return NextResponse.json({ error: 'الشركة غير محددة' }, { status: 400 });
    }

    // التحقق من عدم تكرار الكود داخل نفس الشركة
    const existingBranch = await prisma.branch.findFirst({
      where: { code, companyId: targetCompanyId },
    });
    if (existingBranch) {
      return NextResponse.json({ error: 'الكود موجود مسبقاً في هذه الشركة' }, { status: 409 });
    }

    // إنشاء slug فريد باستخدام الاسم أو الكود
    let baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.branch.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // ✅ إنشاء الفرع – publicToken سيتم توليده تلقائياً بفضل @default(cuid()) في schema.prisma
    // و slug تم إنشاؤه أعلاه
    const newBranch = await prisma.branch.create({
      data: {
        name,
        nameEn: nameEn || null,
        code,
        companyId: targetCompanyId,
        slug,
        // publicToken: سيتم تعبئته تلقائياً من قاعدة البيانات
        allowPublicTickets: true, // قيمة افتراضية
      },
    });

    return NextResponse.json(newBranch, { status: 201 });
  } catch (error) {
    console.error('POST /api/branches error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}