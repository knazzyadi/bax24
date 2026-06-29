// src/app/api/contracts/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';




export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await checkPermission('contracts.read');

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    const branchIds = session.branchIds || [];
    const companyId = session.companyId!;

    const where: any = { companyId, deletedAt: null };

    if (!isAdmin) {
      if (branchIds.length > 0) where.branchId = { in: branchIds };
      else return NextResponse.json({ contracts: [], total: 0, currentPage: page, totalPages: 0, limit });
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { supplier: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (status && status !== 'all') where.status = status;

    const contracts = await prisma.contract.findMany({
      where,
      include: { branch: true, attachments: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    const total = await prisma.contract.count({ where });

    return NextResponse.json({ contracts, total, currentPage: page, totalPages: Math.ceil(total / limit), limit });
  } catch (error: any) {
    console.error('GET /api/contracts error:', error);
    return NextResponse.json({ error: 'خطأ في جلب العقود' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await checkPermission('contracts.create');

    const body = await request.json();
    const {
      code, title, supplier, value, startDate, endDate, description, branchId,
      attachmentIds, notes,
      agentName, agentPhone, agentEmail  // ✅ حقول المندوب
    } = body;

    if (!title || !supplier || !startDate || !endDate) {
      return NextResponse.json({ error: 'العنوان، المورد، وتاريخي البداية والنهاية مطلوبة' }, { status: 400 });
    }

    if (!branchId) {
      return NextResponse.json({ error: 'يرجى تحديد الفرع' }, { status: 400 });
    }

    const companyId = session.companyId!;
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];
      if (!userBranchIds.includes(branchId)) {
        return NextResponse.json({ error: 'لا تملك صلاحية إضافة عقد لهذا الفرع' }, { status: 403 });
      }
    }

    // إنشاء العقد مع حقول المندوب
    const contract = await prisma.contract.create({
      data: {
        code: code || null,
        title,
        supplier,
        value: value || 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description: description || null,
        status: 'PENDING_REVIEW',
        notes: notes || null,
        agentName: agentName || null,
        agentPhone: agentPhone || null,
        agentEmail: agentEmail || null,
        companyId,
        branchId,
        createdBy: session.id,
      },
    });

    // ربط المرفقات إذا وُجدت attachmentIds
    if (attachmentIds && Array.isArray(attachmentIds) && attachmentIds.length > 0) {
      await prisma.contractAttachment.updateMany({
        where: { id: { in: attachmentIds } },
        data: { contractId: contract.id },
      });
    }

    // إعادة العقد مع المرفقات
    const contractWithAttachments = await prisma.contract.findUnique({
      where: { id: contract.id },
      include: { attachments: true },
    });

    return NextResponse.json(contractWithAttachments, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/contracts error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء العقد' }, { status: 500 });
  }
}