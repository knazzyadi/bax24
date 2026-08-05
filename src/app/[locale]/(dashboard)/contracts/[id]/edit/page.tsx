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
  Image as ImageIcon,
  File,
  User,
  Phone,
  Mail,
  Sparkles,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BranchSelector } from "@/components/shared/BranchSelector";

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
    agentName: "",
    agentPhone: "",
    agentEmail: "",
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // كرت الخلفية الزجاجي
  const glassCard =
    "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

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
        if (data.attachments && Array.isArray(data.attachments)) {
          interface ApiAttachment {
          id: string;
          name?: string;
          originalName?: string;
          url: string;
          mimeType: string;
          size: number;
        }

        setAttachments(
          (data.attachments as ApiAttachment[]).map((att) => ({
            id: att.id,
            name: att.originalName || att.name || "",
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
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

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
              {t("editContract")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("editContractSubtitle")}
            </p>
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

      <form onSubmit={handleSubmit} className="relative space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الرئيسي */}
          <div className="lg:col-span-2 space-y-8">
            {/* معلومات العقد */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("basicInfo")}
                </h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("title")} <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t("titlePlaceholder")}
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Building className="h-4 w-4 text-indigo-400" />
                    {t("supplier")} <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder={t("supplierPlaceholder")}
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      {t("value")}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {t("code")}
                    </Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder={t("codePlaceholder")}
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                    />
                  </div>
                </div>

                {/* بيانات المندوب */}
                <div className="grid md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-400" />
                      {t("agentName")}
                    </Label>
                    <Input
                      value={formData.agentName}
                      onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                      placeholder={t("agentNamePlaceholder")}
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-indigo-400" />
                      {t("agentPhone")}
                    </Label>
                    <Input
                      value={formData.agentPhone}
                      onChange={(e) => setFormData({ ...formData, agentPhone: e.target.value })}
                      placeholder={t("agentPhonePlaceholder")}
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-indigo-400" />
                      {t("agentEmail")}
                    </Label>
                    <Input
                      type="email"
                      value={formData.agentEmail}
                      onChange={(e) => setFormData({ ...formData, agentEmail: e.target.value })}
                      placeholder={t("agentEmailPlaceholder")}
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-400" />
                      {t("startDate")} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-rose-400" />
                      {t("endDate")} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("description")}
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t("descriptionPlaceholder")}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[100px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("notes")}
                  </Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t("notesPlaceholder")}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[100px]"
                  />
                </div>

                {/* المرفقات */}
                <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-indigo-400" />
                    {t("attachments")}
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
                      <div className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors px-4 py-2.5 text-sm font-medium border border-indigo-200/50 dark:border-indigo-800/30">
                        <Upload className="h-4 w-4" />
                        {isRtl ? "رفع ملفات" : "Upload Files"}
                      </div>
                    </label>
                    {uploading && <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />}
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {isRtl
                        ? "(PDF, JPEG, PNG, DOC, DOCX, حد أقصى 10 ميجابايت)"
                        : "(PDF, JPEG, PNG, DOC, DOCX, max 10MB)"}
                    </span>
                  </div>

                  {attachments.length > 0 && (
                    <div className="border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-hidden">
                      <div className="bg-slate-50/50 dark:bg-slate-900/50 px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>{isRtl ? `المرفقات (${attachments.length})` : `Attachments (${attachments.length})`}</span>
                        <span className="text-[10px] font-normal">{isRtl ? "انقر للمعاينة" : "Click to preview"}</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {attachments.map((att, idx) => (
                          <div key={att.id} className="flex items-center justify-between p-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="shrink-0">
                                {att.type?.startsWith("image/") ? (
                              <ImageIcon className="h-5 w-5 text-indigo-400" />
                                ) : att.type === "application/pdf" ? (
                                  <FileText className="h-5 w-5 text-rose-400" />
                                ) : (
                                  <File className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate text-slate-700 dark:text-slate-300">{att.name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">{(att.size / 1024).toFixed(0)} KB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-full text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(idx)}
                                className="p-1.5 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
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
            </div>
          </div>

          {/* العمود الجانبي */}
          <div className="space-y-6">
            {/* اختيار الفرع */}
            <div className={cn(glassCard, "border-indigo-200/30 dark:border-indigo-800/30 border-2")}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                  <Building className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("branch")}
                </h3>
              </div>
              <BranchSelector
                value={formData.branchId}
                onValueChange={(val) => setFormData({ ...formData, branchId: val })}
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
                {t("branchHint")}
              </p>
            </div>

            {/* إرشادات */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/40 dark:to-purple-950/40">
                  <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {isRtl ? "إرشادات" : "Guidelines"}
                </h3>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2.5">
                  <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? "الحقول المميزة بـ * إلزامية." : "Fields marked with * are required."}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? "يمكنك تعديل بيانات المندوب في أي وقت." : "You can update agent details anytime."}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? "المرفقات الجديدة ستُضاف إلى المرفقات الحالية." : "New attachments will be added to existing ones."}</span>
                </li>
              </ul>
            </div>

            {/* الأزرار */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12 font-medium"
              >
                <X className="h-4 w-4 ml-2" />
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 ml-2" />}
                {t("save")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}