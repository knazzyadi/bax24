// src/app/[locale]/(dashboard)/assets/[id]/components/AssetAuditLog.tsx
"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { History, User, Clock, Info } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { glassCard } from "../constants";
import { formatDate } from "../utils/assetHelpers";

interface AuditLogEntry {
  id: string;
  action: string;
  userEmail: string;
  changes: Record<string, { old: any; new: any }> | null;
  createdAt: string;
}

interface AssetAuditLogProps {
  assetId: string;
}

export function AssetAuditLog({ assetId }: AssetAuditLogProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("Assets");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch(`/api/assets/${assetId}/audit-log`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [assetId]);

  const actionLabels: Record<string, string> = {
    CREATE: isRtl ? "إنشاء" : "Create",
    UPDATE: isRtl ? "تعديل" : "Update",
    DELETE: isRtl ? "حذف" : "Delete",
    STATUS_CHANGE: isRtl ? "تغيير الحالة" : "Status Change",
    LOCATION_CHANGE: isRtl ? "تغيير الموقع" : "Location Change",
    SERIAL_CHANGE: isRtl ? "تغيير الرقم التسلسلي" : "Serial Change",
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE": return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30";
      case "UPDATE": return "text-blue-500 bg-blue-50 dark:bg-blue-950/30";
      case "DELETE": return "text-red-500 bg-red-50 dark:bg-red-950/30";
      case "STATUS_CHANGE": return "text-amber-500 bg-amber-50 dark:bg-amber-950/30";
      case "LOCATION_CHANGE": return "text-purple-500 bg-purple-50 dark:bg-purple-950/30";
      case "SERIAL_CHANGE": return "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30";
      default: return "text-gray-500 bg-gray-50 dark:bg-gray-800/30";
    }
  };

  if (loading) {
    return (
      <div className={glassCard}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-slate-400">{isRtl ? "جاري التحميل..." : "Loading..."}</div>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return null;
  }

  return (
    <div className={glassCard}>
      <SectionHeader
        icon={<History className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
        title={t("auditLog")}
        iconBgClass="bg-slate-50 dark:bg-slate-950/40"
      />
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                  {actionLabels[log.action] || log.action}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {log.userEmail}
                </span>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(log.createdAt, isRtl)}
              </span>
            </div>
            {log.changes && Object.keys(log.changes).length > 0 && (
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                {Object.entries(log.changes).map(([key, { old, new: newVal }]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="font-medium">{key}:</span>
                    <span className="text-red-500 line-through">{old !== null ? String(old) : "—"}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-emerald-500">{newVal !== null ? String(newVal) : "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}