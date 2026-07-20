// src/app/api/assets/[id]/audit-log/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { getAuditLogs } from "@/lib/audit/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;

    const logs = await getAuditLogs('ASSET', id, session.companyId);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching asset audit logs:', error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب سجل التدقيق" },
      { status: 500 }
    );
  }
}