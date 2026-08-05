// src/app/api/inspection-items/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// Helper function to generate a unique code for item
function generateItemCode(name: string, categoryCode: string): string {
  const prefix = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 3)
    .toUpperCase();

  const suffix = Date.now().toString().slice(-4);

  return `${categoryCode}-${prefix}${suffix}`;
}

type FindingData = {
  id: string;
  title: string;
  riskLevel: string;
  status: string;
  description: string | null;
  correctiveAction: string | null;
  dueDate: Date | null;
};

type ResultData = {
  id: string;
  result: string;
  notes: string | null;
  finding: FindingData | null;
};

type FormItemMap = Record<
  string,
  {
    result: ResultData | null;
  }
>;

// GET: جلب البنود الخاصة بفئة معينة (categoryId) مع النتائج والـ Findings
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);

    const categoryId = searchParams.get('categoryId');
    const inspectionId = searchParams.get('inspectionId');

    if (!categoryId || categoryId.trim() === '') {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      );
    }

    const category = await prisma.inspectionCategory.findFirst({
      where: {
        id: categoryId,
        companyId,
        deletedAt: null,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found or access denied' },
        { status: 404 }
      );
    }

    const items = await prisma.inspectionItem.findMany({
      where: {
        categoryId,
        deletedAt: null,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    let formItemsMap: FormItemMap = {};

    if (inspectionId) {
      const formItems = await prisma.inspectionFormItem.findMany({
        where: {
          inspectionId,
          itemId: {
            in: items.map((item) => item.id),
          },
        },
        include: {
          results: {
            include: {
              findings: true,
            },
          },
        },
      });

      formItemsMap = formItems.reduce<FormItemMap>((acc, formItem) => {
        const itemId = formItem.itemId;

        if (!itemId) {
          return acc;
        }

        const result = formItem.results[0];

        acc[itemId] = {
          result: result
            ? {
                id: result.id,
                result: result.result,
                notes: result.notes,
                finding: result.findings[0]
                  ? {
                      id: result.findings[0].id,
                      title: result.findings[0].title,
                      riskLevel: String(result.findings[0].riskLevel),
                      status: String(result.findings[0].status),
                      description: result.findings[0].description,
                      correctiveAction:
                        result.findings[0].correctiveAction,
                      dueDate: result.findings[0].dueDate,
                    }
                  : null,
              }
            : null,
        };

        return acc;
      }, {});
    }

    const transformedItems = items.map((item) => ({
      ...item,
      result: formItemsMap[item.id]?.result ?? null,
    }));

    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error('Error fetching inspection items:', error);

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: إنشاء بند فرعي جديد
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      categoryId,
      name,
      nameAr,
      cbahiCode,
      description,
      riskLevel,
      inputType,
      sortOrder,
      isActive,
      autoCreateWorkOrder,
      code: providedCode,
    } = body;

    if (!categoryId || categoryId.trim() === '') {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      );
    }

    const trimmedName = name?.trim();
    const trimmedNameAr = nameAr?.trim();

    if (!trimmedName && !trimmedNameAr) {
      return NextResponse.json(
        { error: 'Item name is required in at least one language' },
        { status: 400 }
      );
    }

    const categoryExists = await prisma.inspectionCategory.findFirst({
      where: {
        id: categoryId,
        companyId,
        deletedAt: null,
      },
    });

    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Parent category not found or access denied' },
        { status: 404 }
      );
    }

    const conditions = [];

    if (trimmedName) {
      conditions.push({ name: trimmedName });
    }

    if (trimmedNameAr) {
      conditions.push({ nameAr: trimmedNameAr });
    }

    const existingName = await prisma.inspectionItem.findFirst({
      where: {
        companyId,
        categoryId,
        OR: conditions,
        deletedAt: null,
      },
    });

    if (existingName) {
      return NextResponse.json(
        { error: 'Item with this name already exists in this category' },
        { status: 409 }
      );
    }

    const finalCode =
      providedCode?.trim() ||
      generateItemCode(
        trimmedName || trimmedNameAr || 'ITEM',
        categoryExists.code
      );

    const existingCode = await prisma.inspectionItem.findFirst({
      where: {
        companyId,
        code: finalCode,
        deletedAt: null,
      },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: 'Item code already exists' },
        { status: 409 }
      );
    }

    const newItem = await prisma.inspectionItem.create({
      data: {
        companyId,
        categoryId,
        code: finalCode,
        name: trimmedName || trimmedNameAr || 'Unnamed Item',
        nameAr: trimmedNameAr || null,
        cbahiCode: cbahiCode?.trim() || null,
        description: description?.trim() || null,
        riskLevel: riskLevel || 'medium',
        inputType: inputType || 'pass_fail',
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
        autoCreateWorkOrder: autoCreateWorkOrder ?? false,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error creating inspection item:', error);

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}