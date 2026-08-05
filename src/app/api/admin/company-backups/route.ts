// src/app/api/admin/company-backups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import {
  BackupService,
  PrismaBackupRepository,
  BackupExporter,
  R2Storage,
  BackupType,
  VALID_BACKUP_TYPES,
} from "@/lib/backup";

export async function GET() {
  try {
    const session = await getAuthenticatedSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { prisma } = await import("@/lib/prisma");

    const backups = await prisma.companyBackup.findMany({
      include: {
        company: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = backups.map((b) => ({
      id: b.id,
      companyId: b.companyId,
      companyName: b.company.name,
      fileName: b.fileName,
      fileUrl: b.fileUrl,
      fileSize: b.fileSize,
      status: b.status,
      createdById: b.createdById,
      createdBy: b.createdBy?.name ?? null,
      createdAt: b.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching backups:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // يجب أن يكون userEmail متاحاً في session
    // إذا لم يكن موجوداً، استخدم session.user.email أو أي حقل آخر
    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { companyId, type = "full" } = body as {
      companyId?: string;
      type?: BackupType;
    };

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    if (!VALID_BACKUP_TYPES.includes(type as BackupType)) {
      return NextResponse.json(
        { error: `Invalid backup type. Must be: ${VALID_BACKUP_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const repository = new PrismaBackupRepository();
    const exporter = new BackupExporter(repository);
    const storage = new R2Storage();
    const service = new BackupService(repository, exporter, storage);

    const result = await service.createBackup({
      companyId,
      type: type as BackupType,
      userId: session.userId,
      userEmail, // تمرير البريد الإلكتروني
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Backup creation error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}