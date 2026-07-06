// src/app/[locale]/(dashboard)/contracts/[id]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Calendar,
  FileText,
  Building,
  DollarSign,
  Loader2,
  X,
  History,
  CheckCircle2,
  AlertCircle,
  Zap,
  RefreshCw,
  Info,
  Paperclip,
  Eye,
  File,
  Image,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Sparkles,
  Shield,
  Clock,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { AttachmentsManager } from "@/components/contracts/AttachmentsManager";

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// دالة مساعدة لتنسيق التاريخ بالعربية
const formatDate = (date: string | Date) => {
  if (!date) return "—";
  return format(new Date(date), "d MMMM yyyy", { locale: ar });
};

// مكون لعرض عنصر تفصيلي
function DetailItem({ label, value, icon: Icon, type = "text", isPrice = false, className }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          "text-base font-semibold tracking-tight",
          isPrice ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-100",
          className
        )}>
          {isPrice
            ? Number(value || 0).toLocaleString()
            : type === "date" && value
            ? formatDate(value)
            : value || "—"}
        </span>
        {isPrice && <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-1">ر.س</span>}
      </div>
    </div>
  );
}

// مكون حالة العقد مع أيقونة
function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    ACTIVE: { label: "نشط", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: CheckCircle2 },
    EXPIRED: { label: "منتهي", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30", icon: AlertCircle },
    PENDING_REVIEW: { label: "قيد المراجعة", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", icon: Clock },
    CANCELLED: { label: "ملغي", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800/30", icon: X },
  };
  const config = statusMap[status] || statusMap.PENDING_REVIEW;
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all",
      config.bg,
      config.color,
      "border-slate-200/30 dark:border-slate-700/30"
    )}>
      <Icon className="h-4 w-4" />
      {config.label}
    </span>
  );
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Contracts");
  const resolvedParams = use(params);
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [contract, setContract] = useState<any>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [canEdit, setCanEdit] = useState(false);

  const cancelReasonOptions = [
    { value: "legal_issue", label: t("reasonLegalIssue") },
    { value: "mutual_termination", label: t("reasonMutual") },
    { value: "breach", label: t("reasonBreach") },
    { value: "other", label: t("reasonOther") },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const id = resolvedParams?.id;
      if (!id || id === "undefined") {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`/api/contracts/${id}`);
        if (!res.ok) throw new Error("Failed to fetch contract");
        const contractData = await res.json();
        setContract(contractData);
        setAttachments(contractData.attachments || []);
        setCanEdit(true);
      } catch (err) {
        console.error(err);
        toast.error(t("fetchError"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [resolvedParams?.id, t]);

  const openCancelDialog = () => {
    setCancelReason("");
    setCustomReason("");
    setCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!contract?.id) return;
    let finalReason = cancelReason;
    if (cancelReason === "other") {
      if (!customReason.trim()) {
        toast.error(t("reasonRequired"));
        return;
      }
      finalReason = customReason.trim();
    } else if (!cancelReason) {
      toast.error(t("reasonRequired"));
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch(`/api/contracts/${contract.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: finalReason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("cancelError"));
      }
      toast.success(t("cancelSuccess"));
      setCancelDialogOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || t("cancelError"));
    } finally {
      setCancelling(false);
    }
  };

  const openReactivateDialog = () => {
    if (!contract) return;
    setNewStartDate(contract.startDate ? contract.startDate.split("T")[0] : "");
    setNewEndDate(contract.endDate ? contract.endDate.split("T")[0] : "");
    setReactivateDialogOpen(true);
  };

  const confirmReactivate = async () => {
    if (!contract?.id) return;
    if (!newStartDate || !newEndDate) {
      toast.error(t("datesRequired"));
      return;
    }
    if (new Date(newStartDate) >= new Date(newEndDate)) {
      toast.error(t("endDateAfterStart"));
      return;
    }
    setReactivating(true);
    try {
      const res = await fetch(`/api/contracts/${contract.id}/reactivate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: newStartDate, endDate: newEndDate }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("reactivateError"));
      }
      toast.success(t("reactivateSuccess"));
      setReactivateDialogOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || t("reactivateError"));
    } finally {
      setReactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

  if (!contract) return null;

  const canCancel = contract.status === "ACTIVE" || contract.status === "PENDING_REVIEW";
  const canReactivate = contract.status === "CANCELLED";

  // كرت الخلفية الزجاجي
  const glassCard = "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {contract.title}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-mono text-slate-400 dark:text-slate-500">
                #{contract.code || "—"}
              </span>
              <StatusBadge status={contract.status} />
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          {t("back")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الرئيسي (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* بطاقة المعلومات الأساسية */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
                <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("basicInfo")}
              </h2>
            </div>

            <div className="space-y-8">
              {/* المعلومات الأساسية */}
              <div className="grid sm:grid-cols-2 gap-6">
                <DetailItem label={t("supplier")} value={contract.supplier} icon={Building} />
                <DetailItem label={t("value")} value={contract.value} icon={DollarSign} isPrice />
                <DetailItem label={t("startDate")} value={contract.startDate} icon={CalendarDays} type="date" />
                <DetailItem label={t("endDate")} value={contract.endDate} icon={CalendarDays} type="date" />
              </div>

              {/* معلومات المندوب */}
              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                  <User className="h-3.5 w-3.5" />
                  {t("agentInfo")}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {contract.agentName && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl px-3.5 py-2.5 border border-slate-200/30 dark:border-slate-700/30">
                      <User className="h-4 w-4 text-indigo-400" />
                      <span>{contract.agentName}</span>
                    </div>
                  )}
                  {contract.agentPhone && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl px-3.5 py-2.5 border border-slate-200/30 dark:border-slate-700/30">
                      <Phone className="h-4 w-4 text-indigo-400" />
                      <a
                        href={`tel:${contract.agentPhone}`}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        dir="ltr"
                      >
                        {contract.agentPhone}
                      </a>
                    </div>
                  )}
                  {contract.agentEmail && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl px-3.5 py-2.5 border border-slate-200/30 dark:border-slate-700/30">
                      <Mail className="h-4 w-4 text-indigo-400" />
                      <a
                        href={`mailto:${contract.agentEmail}`}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors break-all"
                      >
                        {contract.agentEmail}
                      </a>
                    </div>
                  )}
                </div>
                {!contract.agentName && !contract.agentPhone && !contract.agentEmail && (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">{t("noAgentInfo")}</p>
                )}
              </div>

              {/* الوصف والملاحظات */}
              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                    <FileText className="h-3.5 w-3.5" />
                    {t("description")}
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {contract.description || t("noDescription")}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                    <Info className="h-3.5 w-3.5" />
                    {t("notes")}
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {contract.notes || t("noNotes")}
                  </div>
                </div>
              </div>

              {/* سبب الإلغاء (إذا كان ملغي) */}
              {contract.status === "CANCELLED" && contract.cancellationReason && (
                <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                    <X className="h-3.5 w-3.5" />
                    {t("cancellationReason")}
                  </div>
                  <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30 text-sm text-rose-700 dark:text-rose-300 font-medium">
                    {contract.cancellationReason}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* المرفقات */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                <Paperclip className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("attachments")}
              </h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                {attachments.length}
              </span>
            </div>
            <AttachmentsManager
              contractId={contract.id}
              canUpload={canEdit}
              canDelete={canEdit}
              maxFiles={15}
            />
          </div>
        </div>

        {/* العمود الجانبي (1/3) */}
        <div className="space-y-6">
          {/* معلومات إضافية */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40">
                <Info className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("additionalInfo")}
              </h3>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  <History className="h-3.5 w-3.5" />
                  {t("createdAt")}
                </div>
                <p className="font-medium text-sm text-slate-700 dark:text-slate-300">
                  {contract.createdAt ? formatDate(contract.createdAt) : "—"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {t("updatedAt")}
                </div>
                <p className="font-medium text-sm text-slate-700 dark:text-slate-300">
                  {contract.updatedAt ? formatDate(contract.updatedAt) : "—"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  <Building className="h-3.5 w-3.5" />
                  {t("branch")}
                </div>
                <p className="font-medium text-sm text-slate-700 dark:text-slate-300">
                  {contract.branch?.name || t("notSpecified")}
                </p>
              </div>
            </div>
          </div>

          {/* مساعدة سريعة */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
            <Shield className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("helpText")}
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex flex-col gap-3">
            {canCancel && (
              <Button
                onClick={openCancelDialog}
                disabled={cancelling}
                variant="outline"
                className="w-full rounded-xl border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-12 font-medium transition-all duration-200"
              >
                {cancelling ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
                {t("terminate")}
              </Button>
            )}
            {canReactivate && (
              <Button
                onClick={openReactivateDialog}
                disabled={reactivating}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
              >
                {reactivating ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                {t("reactivate")}
              </Button>
            )}
          </div>

          {/* زر العودة */}
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium h-11 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            {t("back")}
          </Button>
        </div>
      </div>

      {/* حوار إلغاء العقد */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100">{t("terminateDialogTitle")}</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {t("terminateDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={cancelReason} onValueChange={setCancelReason}>
              <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                <SelectValue placeholder={t("selectReason")} />
              </SelectTrigger>
              <SelectContent>
                {cancelReasonOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cancelReason === "other" && (
              <Textarea
                placeholder={t("reasonPlaceholder")}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-rose-500/50"
              />
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="rounded-xl">
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={cancelling} className="rounded-xl">
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirmTerminate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار إعادة التفعيل */}
      <Dialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100">{t("reactivateTitle")}</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {t("reactivateDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">{t("newStartDate")}</Label>
              <Input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">{t("newEndDate")}</Label>
              <Input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReactivateDialogOpen(false)} className="rounded-xl">
              {t("cancel")}
            </Button>
            <Button onClick={confirmReactivate} disabled={reactivating} className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20">
              {reactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirmReactivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}