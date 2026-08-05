// src/app/api/contracts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { Prisma, ContractStatus } from '@prisma/client';

// ========== تعريف الأنواع ==========
interface Session {
  userId: string;
  companyId?: string;
  role: string;
  branchIds?: string[];
}

interface ContractCreateBody {
  code?: string;
  title: string;
  supplier: string;
  value?: number;
  startDate: string; // سيتم تحويله إلى Date
  endDate: string;
  description?: string;
  branchId: string;
  attachmentIds?: string[];
  notes?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
}

// ========== GET ==========
export async function GET(request: NextRequest) {
  try {
    let session: Session | null = null;
    try {
      session = (await getAuthenticatedSession()) as Session;
    } catch {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    const branchIds = session.branchIds || [];
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة' },
        { status: 400 }
      );
    }

    const where: Prisma.ContractWhereInput = {
      companyId,
      deletedAt: null,
    };

    if (!isAdmin) {
      if (branchIds.length > 0) {
        where.branchId = { in: branchIds };
      } else {
        return NextResponse.json({
          contracts: [],
          total: 0,
          currentPage: page,
          totalPages: 0,
          limit,
        });
      }
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { supplier: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      const validStatuses = Object.values(ContractStatus);
      if (validStatuses.includes(status as ContractStatus)) {
        where.status = status as ContractStatus;
      }
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: { branch: true, attachments: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contract.count({ where }),
    ]);

    return NextResponse.json({
      contracts,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error: unknown) {
    console.error('GET /api/contracts error:', error);
    const message = error instanceof Error ? error.message : 'خطأ في جلب العقود';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ========== POST ==========
export async function POST(request: NextRequest) {
  try {
    let session: Session | null = null;
    try {
      session = (await getAuthenticatedSession()) as Session;
    } catch {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = (await request.json()) as ContractCreateBody;

    const {
      code,
      title,
      supplier,
      value,
      startDate,
      endDate,
      description,
      branchId,
      attachmentIds,
      notes,
      agentName,
      agentPhone,
      agentEmail,
    } = body;

    // التحقق من الحقول المطلوبة
    if (!title || !supplier || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'العنوان، المورد، وتاريخي البداية والنهاية مطلوبة' },
        { status: 400 }
      );
    }

    if (!branchId) {
      return NextResponse.json({ error: 'يرجى تحديد الفرع' }, { status: 400 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة' },
        { status: 400 }
      );
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];
      if (!userBranchIds.includes(branchId)) {
        return NextResponse.json(
          { error: 'لا تملك صلاحية إضافة عقد لهذا الفرع' },
          { status: 403 }
        );
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
        createdBy: session.userId,
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
  } catch (error: unknown) {
    console.error('POST /api/contracts error:', error);
    const message = error instanceof Error ? error.message : 'خطأ في إنشاء العقد';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}