//src\components\audit\AuditTimeline.tsx
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Loader2,
  PlusCircle,
  Pencil,
  Trash2,
  CheckCircle,
} from "lucide-react";

type AuditLog = {
  id: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  userEmail: string;
  createdAt: string;
};

interface AuditTimelineProps {
  entityType: string;
  entityId: string;
}

export default function AuditTimeline({
  entityType,
  entityId,
}: AuditTimelineProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== جلب السجلات =====
  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/audit/${entityType}/${entityId}`);
        if (!res.ok) {
          throw new Error("Failed to load audit logs");
        }
        const data = await res.json();
        setLogs(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [entityType, entityId]); // ✅ الاعتماديات المناسبة فقط

  // ===== أيقونة الحدث =====
  function getIcon(action: string) {
    switch (action) {
      case "CREATE":
        return <PlusCircle className="h-4 w-4" />;
      case "UPDATE":
        return <Pencil className="h-4 w-4" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4" />;
      case "COMPLETE":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Pencil className="h-4 w-4" />;
    }
  }

  // ===== حالة التحميل =====
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  // ===== لا توجد سجلات =====
  if (logs.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        لا يوجد سجل عمليات
      </div>
    );
  }

  // ===== عرض السجلات =====
  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="rounded-lg border p-4">
          <div className="flex items-center gap-2 font-medium">
            {getIcon(log.action)}
            <span>{log.action}</span>
          </div>

          <div className="mt-2 text-sm text-muted-foreground">
            بواسطة: {log.userEmail}
          </div>

          <div className="text-xs text-muted-foreground">
            {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm")}
          </div>

          {log.field && (
            <div className="mt-3 text-sm">
              <strong>{log.field}</strong>
            </div>
          )}

          {(log.oldValue || log.newValue) && (
            <div className="mt-2 rounded-md bg-muted p-2 text-sm">
              <div>
                <strong>القديم:</strong> {log.oldValue ?? "-"}
              </div>
              <div>
                <strong>الجديد:</strong> {log.newValue ?? "-"}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}