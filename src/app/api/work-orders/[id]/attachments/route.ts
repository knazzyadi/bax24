import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadFileToR2, deleteFileFromR2 } from "@/lib/storage";

// GET: جلب جميع مرفقات أمر العمل
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id: workOrderId } = await params;

    const attachments = await prisma.workOrderAttachment.findMany({
      where: { workOrderId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("GET attachments error:", error);
    return NextResponse.json({ error: "خطأ في جلب المرفقات" }, { status: 500 });
  }
}

// POST: رفع ملف جديد
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id: workOrderId } = await params;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string; // الاسم المخصص من المستخدم

    if (!file || !fileName) {
      return NextResponse.json({ error: "الملف والاسم مطلوبان" }, { status: 400 });
    }

    // التحقق من نوع الملف (PDF فقط)
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "نوع الملف غير مسموح. PDF فقط" }, { status: 400 });
    }

    // التحقق من الحجم (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "حجم الملف يتجاوز 10 ميجابايت" }, { status: 400 });
    }

    // رفع الملف إلى Cloudflare R2
    const uploaded = await uploadFileToR2(file, `work-orders/${workOrderId}`);

    const attachment = await prisma.workOrderAttachment.create({
      data: {
        workOrderId,
        url: uploaded.url,
        key: uploaded.key,
        fileName: fileName.trim(),
        originalName: uploaded.originalName,
        provider: "CLOUDFLARE_R2",
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        uploadedBy: session.user.id,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("POST attachment error:", error);
    return NextResponse.json({ error: "خطأ في رفع الملف" }, { status: 500 });
  }
}

// DELETE: حذف ملف
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id: workOrderId } = await params;
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json({ error: "معرف المرفق مطلوب" }, { status: 400 });
    }

    const attachment = await prisma.workOrderAttachment.findFirst({
      where: { id: attachmentId, workOrderId },
    });

    if (!attachment) {
      return NextResponse.json({ error: "المرفق غير موجود" }, { status: 404 });
    }

    // حذف الملف من R2
    await deleteFileFromR2(attachment.key);

    // حذف السجل من قاعدة البيانات
    await prisma.workOrderAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE attachment error:", error);
    return NextResponse.json({ error: "خطأ في حذف الملف" }, { status: 500 });
  }
}