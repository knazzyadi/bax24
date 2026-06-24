// src/app/api/branches/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requirePermission } from '@/lib/auth-helper';


import { randomUUID } from 'crypto';

// دالة لتحويل النص إلى slug صالح للـ URL (أحرف لاتينية، أرقام، شرطات فقط)
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // إزالة علامات التشكيل (مثل é => e)
    .replace(/[^a-z0-9]/g, "-") // إزالة كل ما ليس حرفًا إنجليزيًا أو رقمًا (بما فيها العربية)
    .replace(/-+/g, "-")        // استبدال عدة شرطات بواحدة
    .replace(/^-|-$/g, "");     // إزالة الشرطات من البداية والنهاية
}

export async function GET() {
  try {
    const session = await getSession();
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
    const session = await getSession();
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

    // إنشاء slug من النص الإنجليزي (nameEn) إذا وُجد، وإلا من name (العربي سيُزال)
    const baseText = nameEn && nameEn.trim() ? nameEn : name;
    let baseSlug = generateSlug(baseText);
    // إذا أصبح baseSlug فارغًا (مثلاً لو كان النص عربيًا فقط وتمت إزالته)، نستخدم "branch"
    if (!baseSlug) baseSlug = "branch";
    
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.branch.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // توليد publicToken (حتى لو كان هناك default، نضمن وجود قيمة)
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