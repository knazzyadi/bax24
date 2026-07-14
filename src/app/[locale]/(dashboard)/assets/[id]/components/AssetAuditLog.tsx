// src/app/[locale]/(dashboard)/assets/[id]/components/AssetAuditLog.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Clock,
  User,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================
// أنواع البيانات
// ============================================================

interface AuditLog {
  id: string;
  assetId: string;
  userId: string | null;
  action: string;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface AssetAuditLogProps {
  assetId?: string;
}

// ============================================================
// ترجمة أسماء الحقول (ثابتة لأنها خاصة بالمجال)
// ============================================================

const fieldTranslations: Record<string, string> = {
  id: "المعرف",
  code: "الكود",
  name: "الاسم",
  nameEn: "الاسم بالإنجليزية",
  description: "الوصف",
  model: "الموديل",
  serialNumber: "الرقم التسلسلي",
  manufacturer: "الشركة المصنعة",
  supplierId: "المورد",
  purchaseDate: "تاريخ الشراء",
  operationDate: "تاريخ التشغيل",
  warrantyEnd: "تاريخ انتهاء الضمان",
  lastMaintenanceDate: "تاريخ آخر صيانة",
  notes: "ملاحظات",
  statusId: "الحالة",
  statusName: "الحالة",
  statusNameEn: "الحالة بالإنجليزية",
  statusColor: "لون الحالة",
  typeId: "النوع",
  typeName: "النوع",
  typeNameEn: "النوع بالإنجليزية",
  roomId: "الغرفة",
  roomName: "الغرفة",
  roomNameEn: "الغرفة بالإنجليزية",
  roomCode: "كود الغرفة",
  branchId: "الفرع",
  branchName: "الفرع",
  branchNameEn: "الفرع بالإنجليزية",
  buildingId: "المبنى",
  buildingName: "المبنى",
  buildingNameEn: "المبنى بالإنجليزية",
};

// ============================================================
// دوال مساعدة
// ============================================================

function extractChanges(
  details: Record<string, { old: unknown; new: unknown }> | null
): { field: string; old: unknown; new: unknown }[] {
  if (!details || typeof details !== "object") return [];

  const changes: { field: string; old: unknown; new: unknown }[] = [];

  for (const [key, value] of Object.entries(details)) {
    if (value && typeof value === "object" && "old" in value && "new" in value) {
      if (value.old !== value.new) {
        changes.push({
          field: key,
          old: value.old,
          new: value.new,
        });
      }
    }
  }

  return changes;
}

function getActionIcon(action: string) {
  switch (action) {
    case "CREATE": return <Plus className="h-4 w-4 text-emerald-500" />;
    case "UPDATE": return <Edit className="h-4 w-4 text-blue-500" />;
    case "DELETE": return <Trash2 className="h-4 w-4 text-rose-500" />;
    case "MOVE": return <FileText className="h-4 w-4 text-amber-500" />;
    case "RESTORE": return <RefreshCw className="h-4 w-4 text-purple-500" />;
    default: return <FileText className="h-4 w-4 text-slate-500" />;
  }
}

// ============================================================
// المكون الرئيسي
// ============================================================

export function AssetAuditLog({ assetId: propAssetId }: AssetAuditLogProps) {
  const t = useTranslations("audit"); // ✅ استخدام الترجمة
  const params = useParams();
  const assetId = propAssetId || (params?.id as string);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchLogs = async () => {
    if (!assetId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/assets/${assetId}/audit-log?page=${page}&limit=${limit}`
      );

      if (!res.ok) {
        let errorMessage = t("fetchError");
        try {
          const errorData = await res.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // ignore
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      if (data && typeof data === "object") {
        if (Array.isArray(data.data)) {
          setLogs(data.data);
        } else if (Array.isArray(data)) {
          setLogs(data);
        } else {
          setLogs([]);
          setError(t("unexpectedFormat"));
        }

        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setLogs([]);
        setError(t("unexpectedFormat"));
      }
    } catch (err: any) {
      console.error("Error fetching audit logs:", err);
      const errorMessage = err.message || t("error");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [assetId, page]);

  // ============================================================
  // العرض
  // ============================================================

  if (!assetId) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>{t("noAssetId")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="mr-2 text-slate-500">{t("loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-rose-500">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
        <button
          onClick={fetchLogs}
          className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-lg font-medium">{t("noLogs")}</p>
        <p className="text-sm">{t("noLogsDescription")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("title")} ({total})
        </h3>
        <button
          onClick={fetchLogs}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label={t("refresh")}
        >
          <RefreshCw className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {logs.map((log) => {
          const changes = extractChanges(log.changes);
          let summary = "";

          // ✅ استخدام الترجمة لإنشاء الملخص
          switch (log.action) {
            case "CREATE":
              summary = t("created");
              break;
            case "DELETE":
              summary = t("deleted");
              break;
            case "MOVE":
              summary = t("moved");
              break;
            case "RESTORE":
              summary = t("restored");
              break;
            case "UPDATE": {
              if (changes.length === 0) {
                summary = t("noChanges");
              } else {
                const fieldNames = changes.map(
                  (c) => fieldTranslations[c.field] || c.field
                );
                summary = t("updated", { fields: fieldNames.join("، ") });
              }
              break;
            }
            default:
              summary = t("change");
          }

          return (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getActionIcon(log.action)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {summary}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(log.createdAt).toLocaleString("ar-SA")}
                    </span>
                  </div>

                  {changes.length > 0 &&
                    log.action !== "CREATE" &&
                    log.action !== "DELETE" && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
                        {changes.map((change, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 text-slate-600 dark:text-slate-400"
                          >
                            <span className="font-medium">
                              {fieldTranslations[change.field] || change.field}:
                            </span>
                            <span className="text-rose-500 line-through">
                              {change.old !== null && change.old !== undefined
                                ? String(change.old)
                                : "—"}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="text-emerald-600">
                              {change.new !== null && change.new !== undefined
                                ? String(change.new)
                                : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                {log.user && (
                  <div className="flex items-center gap-1.5 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    <User className="h-3.5 w-3.5" />
                    <span>{log.user.name || log.user.email}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <ChevronRight className="h-4 w-4 inline" />
            {t("previous")}
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t("page", { current: page, total: totalPages })}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {t("next")}
            <ChevronLeft className="h-4 w-4 inline" />
          </button>
        </div>
      )}
    </div>
  );
}