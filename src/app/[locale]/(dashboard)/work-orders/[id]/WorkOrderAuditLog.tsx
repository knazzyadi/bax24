// src/app/[locale]/(dashboard)/work-orders/[id]/WorkOrderAuditLog.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Clock, ArrowRight, Loader2 } from "lucide-react";

interface AuditLogEntry {
  id: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface WorkOrderAuditLogProps {
  workOrderId: string;
}

export function WorkOrderAuditLog({ workOrderId }: WorkOrderAuditLogProps) {
  const t = useTranslations("WorkOrders");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditLog = async () => {
      if (!workOrderId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/work-orders/${workOrderId}/audit-log`);
        if (!res.ok) {
          throw new Error("Failed to fetch audit log");
        }
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : data.logs || []);
      } catch (err) {
        console.error(err);
        setError(t("fetchAuditError") || "Failed to load audit log");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLog();
  }, [workOrderId, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-sm text-rose-500 dark:text-rose-400">
        {error}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
        {t("noAuditLogs") || "No audit logs found"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40">
          <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("auditLog") || "Audit Log"}
        </h3>
      </div>

      <div className="relative space-y-3 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
        {logs.map((log, index) => {
          const isFirst = index === 0;

          return (
            <div key={log.id} className="relative pl-8">
              {/* نقطة زمنية */}
              <div
                className={`absolute left-0 top-[6px] h-5 w-5 rounded-full border-2 ${
                  isFirst
                    ? "border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-400"
                    : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
                } flex items-center justify-center`}
              >
                {isFirst && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>

              <div className="rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {log.user?.name || t("unknownUser") || "Unknown"}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(log.createdAt).toLocaleString(
                          document.documentElement.lang === "ar" ? "ar-SA" : "en-US",
                          { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {log.action === "UPDATE" && log.field && (
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                            {log.field}
                          </span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">
                            {log.newValue || t("empty") || "—"}
                          </span>
                          {log.oldValue && (
                            <>
                              <span className="text-xs text-slate-400">←</span>
                              <span className="text-sm line-through text-slate-400">
                                {log.oldValue}
                              </span>
                            </>
                          )}
                        </span>
                      )}
                      {log.action === "CREATE" && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {t("created") || "Created"}
                        </span>
                      )}
                      {log.action === "DELETE" && (
                        <span className="text-rose-600 dark:text-rose-400">
                          {t("deleted") || "Deleted"}
                        </span>
                      )}
                      {log.action === "STATUS_CHANGE" && (
                        <span className="flex items-center gap-2">
                          <span className="text-slate-500">{t("status") || "Status"}</span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">
                            {log.newValue || t("empty") || "—"}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}