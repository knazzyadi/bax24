// src/app/[locale]/(dashboard)/contracts/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Save,
  X,
  Loader2,
  Calendar,
  Building,
  DollarSign,
  FileText,
  Upload,
  Paperclip,
  Eye,
  Trash2,
  Image,
  File,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { BranchSelector } from "@/components/shared/BranchSelector";

// تعريف نوع المرفق
interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export default function EditContractPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const id = params.id as string;
  const t = useTranslations("Contracts");
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    supplier: "",
    value: "",
    startDate: "",
    endDate: "",
    description: "",
    branchId: "",
    notes: "",
    code: "",
    agentName: "",     // ✅ اسم المندوب
    agentPhone: "",    // ✅ رقم جوال المندوب
    agentEmail: "",    // ✅ بريد المندوب الإلكتروني
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // جلب العقد مع مرفقاته وبيانات المندوب
  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`/api/contracts/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setFormData({
          title: data.title || "",
          supplier: data.supplier || "",
          value: data.value?.toString() || "",
          startDate: data.startDate ? data.startDate.split("T")[0] : "",
          endDate: data.endDate ? data.endDate.split("T")[0] : "",
          description: data.description || "",
          branchId: data.branchId || "",
          notes: data.notes || "",
          code: data.code || "",
          agentName: data.agentName || "",
          agentPhone: data.agentPhone || "",
          agentEmail: data.agentEmail || "",
        });
        // تحويل المرفقات من API إلى الشكل المطلوب
        if (data.attachments && Array.isArray(data.attachments)) {
          setAttachments(
            data.attachments.map((att: any) => ({
              id: att.id,
              name: att.originalName || att.name,
              url: att.url,
              type: att.mimeType,
              size: att.size,
            }))
          );
        }
      } catch (error) {
        console.error(error);
        toast.error(t("fetchError"));
        router.push(`/${locale}/contracts`);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchContract();
  }, [id, locale, router, t]);

  // رفع ملف جديد
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSize) {
        toast.error(`${file.name}: ${isRtl ? "يتجاوز الحد الأقصى 10 ميجابايت" : "exceeds 10MB limit"}`);
        continue;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `${file.name}: ${
            isRtl
              ? "نوع الملف غير مدعوم (PDF, JPEG, PNG, DOC, DOCX)"
              : "Unsupported file type (PDF, JPEG, PNG, DOC, DOCX)"
          }`
        );
        continue;
      }
      setUploading(true);
      const uploadData = new FormData();
      uploadData.append("file", file);
      try {
        const res = await fetch("/api/contracts/upload", { method: "POST", body: uploadData });
        const data = await res.json();
        if (res.ok) {
          const newAttachment: Attachment = {
            id: data.id,
            name: data.name || file.name,
            url: data.url,
            type: file.type,
            size: file.size,
          };
          setAttachments((prev) => [...prev, newAttachment]);
          toast.success(`${file.name} ${isRtl ? "تم الرفع بنجاح" : "uploaded successfully"}`);
        } else {
          toast.error(data.error || (isRtl ? "فشل رفع الملف" : "Upload failed"));
        }
      } catch {
        toast.error(isRtl ? "حدث خطأ في رفع الملف" : "Error uploading file");
      } finally {
        setUploading(false);
      }
    }
    e.target.value = "";
  };

  // حذف مرفق من القائمة (محلياً، سيتم إرسال المعرفات المتبقية عند الحفظ)
  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    toast.success(isRtl ? "تم حذف المرفق" : "Attachment removed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.supplier || !formData.startDate || !formData.endDate) {
      toast.error(t("requiredFields"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        supplier: formData.supplier.trim(),
        value: parseFloat(formData.value) || 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description || null,
        branchId: formData.branchId || null,
        notes: formData.notes || null,
        code: formData.code || null,
        agentName: formData.agentName || null,
        agentPhone: formData.agentPhone || null,
        agentEmail: formData.agentEmail || null,
        attachmentIds: attachments.map((att) => att.id),
      };
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(t("updateSuccess"));
        router.push(`/${locale}/contracts`);
      } else {
        toast.error(result.error || t("updateError"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("networkError"));
    } finally {
      setSaving(false);
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

  return (
    <PageContainer>
      <DetailHeader
        icon={<FileText size={28} />}
        title={t("editContract")}
        subtitle={t("editContractSubtitle")}
        actions={null}
      />
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <InfoCard title={t("basicInfo")} icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground/70">{t("title")} *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t("titlePlaceholder")}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground/70">{t("supplier")} *</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder={t("supplierPlaceholder")}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground/70">{t("value")}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground/70">{t("code")}</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder={t("codePlaceholder")}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                {/* ✅ حقل بيانات المندوب (الاسم، الجوال، البريد) */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground/70 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" /> {t("agentName")}
                    </Label>
                    <Input
                      value={formData.agentName}
                      onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                      placeholder={t("agentNamePlaceholder")}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground/70 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" /> {t("agentPhone")}
                    </Label>
                    <Input
                      value={formData.agentPhone}
                      onChange={(e) => setFormData({ ...formData, agentPhone: e.target.value })}
                      placeholder={t("agentPhonePlaceholder")}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground/70 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" /> {t("agentEmail")}
                    </Label>
                    <Input
                      type="email"
                      value={formData.agentEmail}
                      onChange={(e) => setFormData({ ...formData, agentEmail: e.target.value })}
                      placeholder={t("agentEmailPlaceholder")}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground/70">{t("startDate")} *</Label>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="pl-3 pr-10 h-12 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground/70">{t("endDate")} *</Label>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="pl-3 pr-10 h-12 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground/70">{t("description")}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t("descriptionPlaceholder")}
                    className="min-h-[100px] rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground/70">{t("notes")}</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t("notesPlaceholder")}
                    className="min-h-[100px] rounded-xl"
                  />
                </div>

                {/* ========== قسم المرفقات ========== */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-muted-foreground/70 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-primary" /> {t("attachments")}
                  </Label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-4 py-2 text-sm font-medium">
                        <Upload className="h-4 w-4" />
                        {isRtl ? "اختر ملفات" : "Choose Files"}
                      </div>
                    </label>
                    {uploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    <span className="text-xs text-muted-foreground">
                      {isRtl
                        ? "(PDF, JPEG, PNG, DOC, DOCX, حد أقصى 10 ميجابايت)"
                        : "(PDF, JPEG, PNG, DOC, DOCX, max 10MB)"}
                    </span>
                  </div>

                  {attachments.length > 0 && (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {isRtl ? `المرفقات (${attachments.length})` : `Attachments (${attachments.length})`}
                      </div>
                      <div className="divide-y divide-border">
                        {attachments.map((att, idx) => (
                          <div key={att.id} className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="shrink-0">
                                {att.type?.startsWith("image/") ? (
                                  <Image className="h-5 w-5 text-primary" />
                                ) : att.type === "application/pdf" ? (
                                  <FileText className="h-5 w-5 text-destructive" />
                                ) : (
                                  <File className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{att.name}</p>
                                <p className="text-[10px] text-muted-foreground">{(att.size / 1024).toFixed(0)} KB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-full text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(idx)}
                                className="p-1.5 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </InfoCard>
          </div>

          <div className="space-y-6">
            <InfoCard title={t("branch")} icon={<Building className="h-5 w-5" />}>
              <div className="space-y-4">
                <BranchSelector
                  value={formData.branchId}
                  onValueChange={(val) => setFormData({ ...formData, branchId: val })}
                />
                <p className="text-xs text-muted-foreground">{t("branchHint")}</p>
              </div>
            </InfoCard>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 rounded-full border-red-500 text-red-500 hover:bg-red-50 h-12 font-normal"
              >
                <X className="h-4 w-4 ml-2" /> {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal h-12"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {t("save")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}