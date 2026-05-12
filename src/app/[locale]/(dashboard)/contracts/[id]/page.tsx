"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";          // ✅ تمت الإضافة
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
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { SidebarCard } from "@/components/shared/detail/SidebarCard";

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

function DetailItem({ label, value, icon: Icon, type = "text", isPrice = false }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-lg font-medium tracking-tight", isPrice ? "text-primary" : "text-foreground")}>
          {isPrice
            ? Number(value || 0).toLocaleString()
            : type === "date" && value
            ? format(new Date(value), "d MMMM yyyy", { locale: ar })
            : value || "—"}
        </span>
        {isPrice && <span className="text-[10px] font-medium text-muted-foreground mr-1">ر.س</span>}
      </div>
    </div>
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

  const cancelReasonOptions = [
    { value: "legal_issue", label: t("reasonLegalIssue") },
    { value: "mutual_termination", label: t("reasonMutual") },
    { value: "breach", label: t("reasonBreach") },
    { value: "other", label: t("reasonOther") },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    ACTIVE: { label: t("active"), color: "text-blue-600", bg: "bg-blue-100", icon: CheckCircle2 },
    EXPIRED: { label: t("expired"), color: "text-destructive", bg: "bg-destructive/10", icon: AlertCircle },
    PENDING_REVIEW: { label: t("pendingReview"), color: "text-amber-600", bg: "bg-amber-100", icon: History },
    CANCELLED: { label: t("cancelled"), color: "text-orange-600", bg: "bg-orange-100", icon: X },
  };

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
      <PageContainer>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }
  if (!contract) return null;

  const canCancel = contract.status === "ACTIVE" || contract.status === "PENDING_REVIEW";
  const canReactivate = contract.status === "CANCELLED";

  return (
    <PageContainer>
      <DetailHeader
        icon={<FileText size={28} />}
        title={contract.title}
        subtitle={`${t("reference")} #${contract.code || "—"}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الرئيسي (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          <InfoCard title={t("basicInfo")} icon={<Zap className="h-5 w-5" />}>
            <div className="space-y-8">
              <div className="grid sm:grid-cols-2 gap-6">
                <DetailItem label={t("supplier")} value={contract.supplier} icon={Building} />
                <DetailItem label={t("value")} value={contract.value} icon={DollarSign} isPrice />
                <DetailItem label={t("startDate")} value={contract.startDate} icon={Calendar} type="date" />
                <DetailItem label={t("endDate")} value={contract.endDate} icon={Calendar} type="date" />
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                  <FileText className="h-3.5 w-3.5" /> {t("description")}
                </div>
                <div className="mt-2 p-4 bg-muted/10 rounded-xl text-sm font-medium leading-relaxed text-foreground/80 border border-border/50">
                  {contract.description || t("noDescription")}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                  <FileText className="h-3.5 w-3.5" /> {t("notes")}
                </div>
                <div className="mt-2 p-4 bg-muted/10 rounded-xl text-sm font-medium leading-relaxed text-foreground/80 border border-border/50">
                  {contract.notes || t("noNotes")}
                </div>
              </div>

              {contract.status === "CANCELLED" && contract.cancellationReason && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                    <X className="h-3.5 w-3.5" /> {t("cancellationReason")}
                  </div>
                  <div className="mt-2 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl text-sm font-medium text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                    {contract.cancellationReason}
                  </div>
                </div>
              )}
            </div>
          </InfoCard>
        </div>

        {/* العمود الجانبي (1/3) */}
        <div className="space-y-8">
          <SidebarCard title={t("additionalInfo")} icon={<Info className="h-5 w-5" />}>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                  <History className="h-3 w-3" /> {t("createdAt")}
                </div>
                <p className="font-medium text-sm">
                  {contract.createdAt ? format(new Date(contract.createdAt), "yyyy/MM/dd") : "—"}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                  <Building className="h-3 w-3" /> {t("branch")}
                </div>
                <p className="font-medium text-sm">{contract.branch?.name || t("notSpecified")}</p>
              </div>
            </div>
          </SidebarCard>

          {/* المرفقات (عرض فقط) */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              <Paperclip className="h-4 w-4" />
              {t("attachments")} ({attachments.length})
            </div>
            {attachments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">{t("noAttachments")}</p>
            )}
            <div className="space-y-2">
              {attachments.map((att, idx) => (
                <div key={att.id || idx} className="flex items-center justify-between p-2 hover:bg-muted/20 rounded-xl transition-colors">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {att.type?.startsWith("image/") ? (
                      <Image className="h-5 w-5 text-primary shrink-0" />
                    ) : att.type === "application/pdf" ? (
                      <FileText className="h-5 w-5 text-destructive shrink-0" />
                    ) : (
                      <File className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate max-w-[200px]">{att.name}</span>
                  </div>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs font-medium flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" /> {t("preview")}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs font-medium text-muted-foreground">{t("helpText")}</div>
          </div>

          {/* أزرار الإجراءات: فسخ / إعادة تفعيل فقط */}
          <div className="flex flex-col gap-3">
            {canCancel && (
              <Button
                onClick={openCancelDialog}
                disabled={cancelling}
                variant="outline"
                className="w-full rounded-full border-orange-500 text-orange-500 hover:bg-orange-500/10 h-12 font-medium"
              >
                {cancelling ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
                {t("terminate")}
              </Button>
            )}
            {canReactivate && (
              <Button
                onClick={openReactivateDialog}
                disabled={reactivating}
                variant="outline"
                className="w-full rounded-full border-primary text-primary hover:bg-primary/10 h-12 font-medium"
              >
                {reactivating ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                {t("reactivate")}
              </Button>
            )}
          </div>

          {/* زر العودة (إلغاء) */}
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full rounded-full border-primary text-primary hover:bg-primary/10 font-medium h-11"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            {t("back")}
          </Button>
        </div>
      </div>

      {/* حوار إلغاء العقد */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-card border-border shadow-lg">
          <DialogHeader>
            <DialogTitle>{t("terminateDialogTitle")}</DialogTitle>
            <DialogDescription>{t("terminateDialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={cancelReason} onValueChange={setCancelReason}>
              <SelectTrigger className="bg-background border-border">
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
                className="rounded-xl bg-background border-border"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={cancelling}>
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirmTerminate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار إعادة التفعيل */}
      <Dialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-card border-border shadow-lg">
          <DialogHeader>
            <DialogTitle>{t("reactivateTitle")}</DialogTitle>
            <DialogDescription>{t("reactivateDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("newStartDate")}</Label>
              <Input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="rounded-xl bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("newEndDate")}</Label>
              <Input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="rounded-xl bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivateDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={confirmReactivate} disabled={reactivating} className="bg-primary hover:bg-primary/90">
              {reactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirmReactivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}