"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Image as ImageIcon, Plus, FileText, Building, DollarSign, Calendar, Upload, Loader2, X, Save, 
  Paperclip, File, Trash2, Eye, User, Phone, Mail,
  Sparkles, CheckCircle2,
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

export default function NewContractPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Contracts');
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    supplier: "",
    value: "",
    startDate: "",
    endDate: "",
    description: "",
    branchId: "",
    agentName: "",
    agentPhone: "",
    agentEmail: "",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSize) {
        toast.error(`${file.name}: ${isRtl ? "يتجاوز الحد الأقصى 10 ميجابايت" : "exceeds 10MB limit"}`);
        continue;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: ${isRtl ? "نوع الملف غير مدعوم (PDF, JPEG, PNG, DOC, DOCX)" : "Unsupported file type (PDF, JPEG, PNG, DOC, DOCX)"}`);
        continue;
      }
      setUploading(true);
      const uploadData = new FormData();
      uploadData.append("file", file);
      try {
        const res = await fetch("/api/contracts/upload", { method: "POST", body: uploadData });
        const data = await res.json();
        if (res.ok) {
          setAttachments(prev => [...prev, {
            id: data.id,
            name: data.name || file.name,
            url: data.url,
            type: file.type,
            size: file.size,
          }]);
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

  const removeAttachment = async (index: number) => {
    const att = attachments[index];
    if (!att) return;
    setAttachments(prev => prev.filter((_, i) => i !== index));
    toast.success(isRtl ? "تم حذف المرفق" : "Attachment removed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.supplier || !formData.value || !formData.startDate || !formData.endDate) {
      toast.error(isRtl ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    if (!formData.branchId) {
      toast.error(isRtl ? "يرجى اختيار الفرع" : "Please select a branch");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        code: formData.code || null,
        supplier: formData.supplier,
        value: parseFloat(formData.value) || 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description || null,
        branchId: formData.branchId,
        agentName: formData.agentName || null,
        agentPhone: formData.agentPhone || null,
        agentEmail: formData.agentEmail || null,
        attachmentIds: attachments.map(a => a.id),
      };
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseText = await res.text();
      let data;
      try { data = JSON.parse(responseText); } catch { data = { error: responseText }; }
      if (!res.ok) {
        throw new Error(data.error || "Failed to create contract");
      }
      toast.success(isRtl ? "تم إنشاء العقد بنجاح" : "Contract created successfully");
      router.push(`/${locale}/contracts`);
      router.refresh();
    } catch (err: unknown) {
    console.error("Create error:", err);

    let message = isRtl
      ? "فشل إنشاء العقد"
      : "Failed to create contract";

    if (err instanceof Error) {
      message = err.message;
    }

    toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  const containerClass = "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Plus className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t('newTitle')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('newSubtitle')}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
        >
          <X className="h-4 w-4 ml-2" />
          {isRtl ? "إلغاء" : "Cancel"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الرئيسي */}
          <div className="lg:col-span-2 space-y-8">
            {/* معلومات العقد */}
            <div className={containerClass}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {isRtl ? "المعلومات الأساسية" : "Basic Information"}
                </h2>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {t('title')} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={t('titlePlaceholder')}
                      required
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {t('code')}
                    </Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder={isRtl ? "اختياري" : "Optional"}
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <Building className="h-4 w-4 text-indigo-400" />
                      {t('supplier')} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder={t('supplierPlaceholder')}
                      required
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      {t('value')} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="0.00"
                      required
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                    />
                  </div>
                </div>

                {/* بيانات المندوب */}
                <div className="grid md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-400" />
                      {t('agentName')}
                    </Label>
                    <Input
                      value={formData.agentName}
                      onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                      placeholder={t('agentNamePlaceholder')}
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-indigo-400" />
                      {t('agentPhone')}
                    </Label>
                    <Input
                      value={formData.agentPhone}
                      onChange={(e) => setFormData({ ...formData, agentPhone: e.target.value })}
                      placeholder={t('agentPhonePlaceholder')}
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-indigo-400" />
                      {t('agentEmail')}
                    </Label>
                    <Input
                      type="email"
                      value={formData.agentEmail}
                      onChange={(e) => setFormData({ ...formData, agentEmail: e.target.value })}
                      placeholder={t('agentEmailPlaceholder')}
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-400" />
                      {t('startDate')} <span className="text-rose-500">*</span>
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
                      {t('endDate')} <span className="text-rose-500">*</span>
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
                    {t('description')}
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('descriptionPlaceholder')}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[100px]"
                  />
                </div>

                {/* المرفقات */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-indigo-400" />
                    {isRtl ? "المرفقات" : "Attachments"}
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
                      {isRtl ? "(PDF, JPEG, PNG, DOC, DOCX, حد أقصى 10 ميجابايت)" : "(PDF, JPEG, PNG, DOC, DOCX, max 10MB)"}
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
                                {att.type.startsWith('image/') ? (
                                  <ImageIcon className="h-5 w-5 text-indigo-400" />
                                ) : att.type === 'application/pdf' ? (
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
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
                                <Eye className="h-4 w-4" />
                              </a>
                              <button type="button" onClick={() => removeAttachment(idx)} className="p-1.5 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
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
            {/* إرشادات */}
            <div className={cn(containerClass, "space-y-4")}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/40 dark:to-purple-950/40">
                  <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {isRtl ? "إرشادات" : "Guidelines"}
                </h3>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? "تأكد من إدخال جميع البيانات المطلوبة بدقة." : "Ensure all required fields are filled accurately."}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? "الحقول المميزة بعلامة (*) إلزامية." : "Fields marked with (*) are mandatory."}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? "يمكنك رفع عدة مرفقات كمراجع إضافية." : "You can upload multiple attachments as additional references."}</span>
                </li>
              </ul>
            </div>

            {/* اختيار الفرع */}
            <div className={cn(containerClass, "space-y-4 border-indigo-200/30 dark:border-indigo-800/30 border-2")}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                  <Building className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {isRtl ? "الفرع" : "Branch"} <span className="text-rose-500">*</span>
                </h3>
              </div>
              <BranchSelector
                value={formData.branchId}
                onValueChange={(v) => setFormData({ ...formData, branchId: v })}
              />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {isRtl
                  ? "سيتم عزل العقد بناءً على الفرع المختار."
                  : "The contract will be isolated based on the selected branch."}
              </p>
            </div>

            {/* الأزرار */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => router.back()}
                variant="outline"
                className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12 font-medium"
              >
                <X className="h-4 w-4 ml-2" />
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Save className="h-5 w-5 ml-2" />
                    {t('save')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}