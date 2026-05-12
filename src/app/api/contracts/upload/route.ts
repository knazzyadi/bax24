// src/app/api/contracts/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requirePermission } from '@/lib/permissions';
import { uploadFileToR2 } from '@/lib/storage';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('contracts.create', session);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'لا يوجد ملف مرفق' }, { status: 400 });
    }

    // التحقق من نوع الملف (يمكنك توسيع القائمة)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'حجم الملف يتجاوز 10 ميجابايت' }, { status: 400 });
    }

    // رفع الملف إلى R2 (مجلد contracts بدلاً من tickets)
    const uploaded = await uploadFileToR2(file, 'contracts');

    // إنشاء سجل في ContractAttachment (بدون contractId في البداية، سيتم ربطه لاحقاً)
    const attachment = await prisma.contractAttachment.create({
      data: {
        url: uploaded.url,
        key: uploaded.key,
        provider: 'CLOUDFLARE_R2',
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        originalName: uploaded.originalName,
        // contractId سيتم تعيينه عند ربطه بالعقد (يمكن تمريره عبر formData)
      },
      select: { id: true, url: true, originalName: true },
    });

    return NextResponse.json({
      id: attachment.id,
      url: attachment.url,
      originalName: attachment.originalName,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'حدث خطأ في رفع الملف' }, { status: 500 });
  }
}