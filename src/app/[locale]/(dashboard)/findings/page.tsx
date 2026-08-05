// src/app/[locale]/(dashboard)/findings/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Eye,
  XCircle,
  FileWarning,
  Filter,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ✅ استيراد النوع من Prisma
import { FindingStatus } from "@prisma/client";

// ============================================================
// تعريف الأنواع باستخدام FindingStatus
// ============================================================
interface Finding {
  id: string;
  title: string;
  description: string | null;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: FindingStatus; // ✅ النوع الصحيح
  correctiveAction: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  result: {
    id: string;
    status: string;
    inspectionFormItem: {
      id: string;
      name: string;
      nameEn: string | null;
      inspection: {
        id: string;
        title: string;
        code: string;
      };
    };
  };
  workOrderFindings: Array<{
    workOrder: {
      id: string;
      code: string;
      title: string;
      status: {
        id: string;
        name: string;
        nameEn: string;
        color: string;
      };
    };
  }>;
}

// ============================================================
// مكون رئيسي
// ============================================================
export default function FindingsPage() {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("Findings");

  // ===== حالات البيانات =====
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // ===== حالات الفلترة =====
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterRisk, setFilterRisk] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // ===== حالات التحديد (Checkbox) =====
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // ===== حالات الـ Modal =====
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workOrderTitle, setWorkOrderTitle] = useState("");
  const [workOrderDescription, setWorkOrderDescription] = useState("");
  const [workOrderPriority, setWorkOrderPriority] = useState("");

  // ===== جلب البيانات =====
  const fetchFindings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (filterStatus) params.append("status", filterStatus);
      if (filterRisk) params.append("riskLevel", filterRisk);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/inspection-findings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFindings(data.data || data);
        setTotal(data.total || data.length || 0);
      } else {
        toast.error(t("fetchError"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterStatus, filterRisk, searchQuery, t]);

    useEffect(() => {
    const timer = setTimeout(() => {
      fetchFindings();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchFindings]);

  // ===== دوال التحديد =====
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(findings.map((f) => f.id));
    }
    setSelectAll(!selectAll);
  };

  // عند تغيير الصفحة أو الفلترة، نعيد تعيين التحديدات
    useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedIds([]);
      setSelectAll(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [page, filterStatus, filterRisk, searchQuery]);

  // ===== دوال الـ Modal =====
  const openModal = () => {
    if (selectedIds.length === 0) {
      toast.error(t("selectAtLeastOne"));
      return;
    }
    setWorkOrderTitle(
      isRtl
        ? `أمر عمل لـ ${selectedIds.length} ملاحظة`
        : `Work Order for ${selectedIds.length} findings`
    );
    setWorkOrderDescription("");
    setWorkOrderPriority("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setWorkOrderTitle("");
    setWorkOrderDescription("");
    setWorkOrderPriority("");
  };

  // ===== إنشاء أمر العمل =====
  const handleCreateWorkOrder = async () => {
    if (!workOrderTitle.trim()) {
      toast.error(isRtl ? "العنوان مطلوب" : "Title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        findingIds: selectedIds,
        title: workOrderTitle.trim(),
        description: workOrderDescription.trim() || null,
        priority: workOrderPriority || null,
      };

      const res = await fetch("/api/work-orders/from-findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(
          isRtl
            ? `تم إنشاء أمر العمل ${data.code} بنجاح`
            : `Work order ${data.code} created successfully`
        );
        closeModal();
        setSelectedIds([]);
        setSelectAll(false);
        await fetchFindings();
        router.push(`/${locale}/work-orders/${data.id}`);
      } else {
        const error = await res.json();
        toast.error(error.error || t("createError"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===== حالة التحميل =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  // ===== دالة عرض حالة الـ Finding (معدلة لتطابق قيم FindingStatus) =====
  const getStatusBadge = (status: FindingStatus) => {
    const config: Record<
      FindingStatus,
      { label: string; icon: React.ReactNode; className: string }
    > = {
      Open: {
        label: isRtl ? "مفتوحة" : "Open",
        icon: <AlertTriangle className="h-3 w-3" />,
        className: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
      },
      InProgress: {
        label: isRtl ? "قيد التنفيذ" : "In Progress",
        icon: <Clock className="h-3 w-3" />,
        className: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
      },
      Resolved: {
        label: isRtl ? "تم الحل" : "Resolved",
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
      },
      Verified: {
        label: isRtl ? "تم التحقق" : "Verified",
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
      },
      Closed: {
        label: isRtl ? "مغلقة" : "Closed",
        icon: <XCircle className="h-3 w-3" />,
        className: "bg-slate-100 text-slate-700 dark:bg-slate-800/30 dark:text-slate-400",
      },
      Cancelled: {
        label: isRtl ? "ملغية" : "Cancelled",
        icon: <XCircle className="h-3 w-3" />,
        className: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
      },
    };
    const c = config[status] || config.Open;
    return (
      <Badge className={`gap-1 font-medium ${c.className}`}>
        {c.icon}
        {c.label}
      </Badge>
    );
  };

  const getRiskBadge = (risk: string) => {
    const config: Record<
      string,
      { label: string; className: string }
    > = {
      LOW: {
        label: isRtl ? "منخفض" : "Low",
        className: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
      },
      MEDIUM: {
        label: isRtl ? "متوسط" : "Medium",
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
      },
      HIGH: {
        label: isRtl ? "مرتفع" : "High",
        className: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
      },
      CRITICAL: {
        label: isRtl ? "حرج" : "Critical",
        className: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
      },
    };
    const c = config[risk] || config.MEDIUM;
    return <Badge className={`font-medium ${c.className}`}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/40">
            <FileWarning className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t("title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("subtitle")} ({total})
            </p>
          </div>
        </div>

        {/* زر إنشاء أمر عمل */}
        <div className="flex items-center gap-3">
          <Button
            onClick={openModal}
            disabled={selectedIds.length === 0}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          >
            <Plus className="h-4 w-4" />
            {isRtl
              ? `إنشاء أمر عمل (${selectedIds.length})`
              : `Create Work Order (${selectedIds.length})`}
          </Button>
        </div>
      </div>

      {/* الفلاتر */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <Filter className="h-4 w-4 text-slate-400" />
        <Input
          placeholder={isRtl ? "بحث..." : "Search..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-48 h-9"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40 h-9">
            <SelectValue placeholder={isRtl ? "جميع الحالات" : "All Status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{isRtl ? "الكل" : "All"}</SelectItem>
            <SelectItem value="Open">{isRtl ? "مفتوحة" : "Open"}</SelectItem>
            <SelectItem value="InProgress">
              {isRtl ? "قيد التنفيذ" : "In Progress"}
            </SelectItem>
            <SelectItem value="Resolved">{isRtl ? "تم الحل" : "Resolved"}</SelectItem>
            <SelectItem value="Verified">{isRtl ? "تم التحقق" : "Verified"}</SelectItem>
            <SelectItem value="Closed">{isRtl ? "مغلقة" : "Closed"}</SelectItem>
            <SelectItem value="Cancelled">{isRtl ? "ملغية" : "Cancelled"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-full sm:w-40 h-9">
            <SelectValue placeholder={isRtl ? "جميع المخاطر" : "All Risk"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{isRtl ? "الكل" : "All"}</SelectItem>
            <SelectItem value="LOW">{isRtl ? "منخفض" : "Low"}</SelectItem>
            <SelectItem value="MEDIUM">{isRtl ? "متوسط" : "Medium"}</SelectItem>
            <SelectItem value="HIGH">{isRtl ? "مرتفع" : "High"}</SelectItem>
            <SelectItem value="CRITICAL">{isRtl ? "حرج" : "Critical"}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchQuery("");
            setFilterStatus("");
            setFilterRisk("");
          }}
          className="text-slate-400"
        >
          {isRtl ? "إعادة تعيين" : "Reset"}
        </Button>
      </div>

      {/* جدول Findings */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center justify-center w-5 h-5 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {selectAll ? (
                    <CheckSquare className="h-4 w-4 text-indigo-600" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              </TableHead>
              <TableHead>{isRtl ? "العنوان" : "Title"}</TableHead>
              <TableHead>{isRtl ? "الفحص" : "Inspection"}</TableHead>
              <TableHead>{isRtl ? "الخطورة" : "Risk"}</TableHead>
              <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
              <TableHead>{isRtl ? "أمر العمل" : "Work Order"}</TableHead>
              <TableHead>{isRtl ? "التاريخ" : "Date"}</TableHead>
              <TableHead className="text-center">{isRtl ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {findings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                  {isRtl ? "لا توجد ملاحظات" : "No findings found"}
                </TableCell>
              </TableRow>
            ) : (
              findings.map((finding) => (
                <TableRow key={finding.id}>
                  {/* Checkbox */}
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(finding.id)}
                      onChange={() => toggleSelection(finding.id)}
                      disabled={finding.status === "Resolved" || finding.status === "Cancelled"}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                    />
                  </TableCell>

                  {/* العنوان */}
                  <TableCell>
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {finding.title}
                    </div>
                    {finding.description && (
                      <div className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">
                        {finding.description}
                      </div>
                    )}
                  </TableCell>

                  {/* الفحص */}
                  <TableCell>
                    <div className="text-sm">
                      {finding.result?.inspectionFormItem?.inspection?.title ||
                        "-"}
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      {finding.result?.inspectionFormItem?.inspection?.code ||
                        ""}
                    </div>
                  </TableCell>

                  {/* الخطورة */}
                  <TableCell>{getRiskBadge(finding.riskLevel)}</TableCell>

                  {/* الحالة */}
                  <TableCell>{getStatusBadge(finding.status)}</TableCell>

                  {/* أمر العمل */}
                  <TableCell>
                    {finding.workOrderFindings && finding.workOrderFindings.length > 0 ? (
                      <div className="space-y-1">
                        {finding.workOrderFindings.map((wof) => (
                          <button
                            key={wof.workOrder.id}
                            onClick={() =>
                              router.push(`/${locale}/work-orders/${wof.workOrder.id}`)
                            }
                            className="text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline block"
                          >
                            {wof.workOrder.code}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </TableCell>

                  {/* التاريخ */}
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                    {format(new Date(finding.createdAt), "dd/MM/yyyy")}
                  </TableCell>

                  {/* الإجراءات */}
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        router.push(`/${locale}/findings/${finding.id}`)
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {isRtl
              ? `عرض ${findings.length} من ${total}`
              : `Showing ${findings.length} of ${total}`}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {isRtl ? "السابق" : "Previous"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= total}
            >
              {isRtl ? "التالي" : "Next"}
            </Button>
          </div>
        </div>
      )}

      {/* ===== Modal: إنشاء أمر عمل من Findings ===== */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isRtl ? "إنشاء أمر عمل" : "Create Work Order"}
            </DialogTitle>
            <DialogDescription>
              {isRtl
                ? `سيتم إنشاء أمر عمل واحد لـ ${selectedIds.length} ملاحظة محددة.`
                : `A single work order will be created for ${selectedIds.length} selected findings.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wo-title">
                {isRtl ? "العنوان" : "Title"} <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="wo-title"
                value={workOrderTitle}
                onChange={(e) => setWorkOrderTitle(e.target.value)}
                placeholder={isRtl ? "أدخل عنوان أمر العمل" : "Enter work order title"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wo-description">
                {isRtl ? "الوصف" : "Description"}
              </Label>
              <Textarea
                id="wo-description"
                value={workOrderDescription}
                onChange={(e) => setWorkOrderDescription(e.target.value)}
                placeholder={
                  isRtl
                    ? "وصف إضافي (اختياري)"
                    : "Additional description (optional)"
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wo-priority">
                {isRtl ? "الأولوية" : "Priority"}
              </Label>
              <Select value={workOrderPriority} onValueChange={setWorkOrderPriority}>
                <SelectTrigger id="wo-priority">
                  <SelectValue
                    placeholder={isRtl ? "اختر الأولوية" : "Select priority"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">{isRtl ? "منخفضة" : "Low"}</SelectItem>
                  <SelectItem value="MEDIUM">{isRtl ? "متوسطة" : "Medium"}</SelectItem>
                  <SelectItem value="HIGH">{isRtl ? "عالية" : "High"}</SelectItem>
                  <SelectItem value="CRITICAL">{isRtl ? "حرجة" : "Critical"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-800/30">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {isRtl
                  ? `سيتم ربط ${selectedIds.length} ملاحظة بهذا أمر العمل.`
                  : `${selectedIds.length} findings will be linked to this work order.`}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={isSubmitting}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleCreateWorkOrder} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isRtl ? "إنشاء" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}