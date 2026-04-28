import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/auth';
import { requirePermission } from '@/lib/permissions';

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

    // التحقق من نوع الملف (اختياري، نسمح بأنواع متعددة)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم' }, { status: 400 });
    }

    // الحد الأقصى 10 ميجابايت
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'حجم الملف يتجاوز 10 ميجابايت' }, { status: 400 });
    }

    // إنشاء اسم ملف فريد
    const extension = path.extname(file.name);
    const fileName = `${uuidv4()}${extension}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'contracts');
    const filePath = path.join(uploadDir, fileName);

    // التأكد من وجود المجلد
    await mkdir(uploadDir, { recursive: true });

    // تحويل الملف إلى Buffer وحفظه
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // إرجاع رابط الملف (يمكن جعله مسارًا نسبيًا أو مطلقًا)
    const fileUrl = `/uploads/contracts/${fileName}`;
    return NextResponse.json({ url: fileUrl });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'حدث خطأ في رفع الملف' }, { status: 500 });
  }
}