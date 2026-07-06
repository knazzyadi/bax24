// src/app/api/branches/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  try {
    // ✅ استخدام try-catch داخلي لتجنب فشل الطلب بالكامل
    let session;
    try {
      session = await getAuthenticatedSession();
    } catch {
      // إذا فشلت المصادقة، نعيد مصفوفة فارغة بدلاً من خطأ 401
      return NextResponse.json([]);
    }

    if (!session) {
      return NextResponse.json([]);
    }

    const roleName = session.role;
    const userBranchIds = session.branchIds || [];
    const companyId = session.companyId;

    // سوبر أدمن: جلب كل الفروع
    if (roleName === 'SUPER_ADMIN') {
      const branches = await prisma.branch.findMany({
        include: { company: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(branches);
    }

    // للمستخدمين العاديين أو الإداريين: فلترة حسب الشركة والصلاحيات
    if (companyId) {
      let where: any = { companyId: companyId };
      const isAdmin = roleName === 'ADMIN' || roleName === 'SUPER_ADMIN';
      
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

    // إذا لم تكن هناك شركة مرتبطة
    return NextResponse.json([]);
  } catch (error) {
    console.error('GET /api/branches error:', error);
    // ✅ في حالة أي خطأ، نعيد مصفوفة فارغة بدلاً من 500
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    let session;
    try {
      session = await getAuthenticatedSession();
    } catch {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const roleName = session.role;
    const { name, nameEn, code, companyId } = await request.json();

    if (!name || !code) {
      return NextResponse.json({ error: 'اسم الفرع والكود مطلوبان' }, { status: 400 });
    }

    let targetCompanyId = companyId;
    if (roleName !== 'SUPER_ADMIN') {
      if (!session.companyId) {
        return NextResponse.json({ error: 'الشركة غير محددة' }, { status: 400 });
      }
      targetCompanyId = session.companyId;
    }

    if (!targetCompanyId) {
      return NextResponse.json({ error: 'الشركة غير محددة' }, { status: 400 });
    }

    const existingBranch = await prisma.branch.findFirst({
      where: { code, companyId: targetCompanyId },
    });
    if (existingBranch) {
      return NextResponse.json({ error: 'الكود موجود مسبقاً في هذه الشركة' }, { status: 409 });
    }

    const baseText = nameEn && nameEn.trim() ? nameEn : name;
    let baseSlug = generateSlug(baseText);
    if (!baseSlug) baseSlug = "branch";
    
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.branch.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const publicToken = randomUUID();

    const newBranch = await prisma.branch.create({
      data: {
        name,
        nameEn: nameEn || null,
        code,
        companyId: targetCompanyId,
        slug,
        publicToken,
        allowPublicTickets: true,
      },
    });

    return NextResponse.json(newBranch, { status: 201 });
  } catch (error) {
    console.error('POST /api/branches error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}