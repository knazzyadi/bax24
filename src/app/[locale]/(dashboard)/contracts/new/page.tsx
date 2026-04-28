"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Plus, FileText, Building, DollarSign, Calendar, Upload, Loader2, X, Save, 
  Paperclip, File, Image, FileUp, Trash2, Eye
} from "lucide-react";

import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { BranchSelector } from "@/components/shared/BranchSelector";

interface Attachment {
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
    branchId: "",      // ✅ استخدم branchId بدلاً من buildingId
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 10 * 1024 * 1024; // 10 MB
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
          setAttachments(prev => [...prev, { name: file.name, url: data.url, type: file.type, size: file.size }]);
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

  const removeAttachment = (index: number) => {
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
        attachments: attachments.map(a => ({ name: a.name, url: a.url, type: a.type, size: a.size })),
      };
      console.log("Sending payload:", payload);
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
    } catch (err: any) {
      console.error("Create error:", err);
      toast.error(err.message || (isRtl ? "فشل إنشاء العقد" : "Failed to create contract"));
    } finally {
      setLoading(false);
    }
  };

  const containerClass = "bg-card border border-border rounded-md p-6 shadow-sm hover:shadow-md transition-all";

  return (
    <PageContainer>
      <DetailHeader
        icon={<Plus size={28} />}
        title={t('newTitle')}
        subtitle={t('newSubtitle')}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الرئيسي */}
          <div className="lg:col-span-2 space-y-8">
            <InfoCard title={t('basicInfo')} icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-black text-muted-foreground/70">{t('title')} *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={t('titlePlaceholder')}
                      required
                      className="h-14 rounded-2xl border-primary bg-background focus-visible:ring-2 focus-visible:ring-primary font-bold text-lg px-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-black text-muted-foreground/70">{t('code')}</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="اختياري"
                      className="h-14 rounded-2xl border-primary bg-background font-bold text-lg px-6"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-black text-muted-foreground/70 flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" /> {t('supplier')} *
                    </Label>
                    <Input
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder={t('supplierPlaceholder')}
                      required
                      className="h-14 rounded-2xl border-primary bg-background font-bold text-lg px-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-black text-muted-foreground/70 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-500" /> {t('value')} *
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="0.00"
                      required
                      className="h-14 rounded-2xl border-primary bg-background font-bold text-lg px-6"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-black text-muted-foreground/70 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" /> {t('startDate')} *
                    </Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="h-14 rounded-2xl border-primary bg-background font-bold px-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-black text-muted-foreground/70 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-destructive" /> {t('endDate')} *
                    </Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="h-14 rounded-2xl border-primary bg-background font-bold px-6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground/70">{t('description')}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('descriptionPlaceholder')}
                    className="rounded-2xl border-primary bg-background focus-visible:ring-2 focus-visible:ring-primary font-bold p-6 min-h-[100px]"
                  />
                </div>

                {/* المرفقات */}
                <div className="space-y-4">
                  <Label className="text-sm font-black text-muted-foreground/70 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-primary" /> {t('attachments')}
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
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-4 py-2 text-sm font-black">
                        <Upload className="h-4 w-4" />
                        {isRtl ? "اختر ملفات" : "Choose Files"}
                      </div>
                    </label>
                    {uploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    <span className="text-xs text-muted-foreground">
                      {isRtl ? "(PDF, JPEG, PNG, DOC, DOCX, حد أقصى 10 ميجابايت)" : "(PDF, JPEG, PNG, DOC, DOCX, max 10MB)"}
                    </span>
                  </div>

                  {attachments.length > 0 && (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="bg-muted/30 px-4 py-2 text-xs font-black text-muted-foreground uppercase tracking-wider">
                        {isRtl ? `المرفقات (${attachments.length})` : `Attachments (${attachments.length})`}
                      </div>
                      <div className="divide-y divide-border">
                        {attachments.map((att, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="shrink-0">
                                {att.type.startsWith('image/') ? (
                                  <Image className="h-5 w-5 text-primary" />
                                ) : att.type === 'application/pdf' ? (
                                  <FileText className="h-5 w-5 text-destructive" />
                                ) : (
                                  <File className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate">{att.name}</p>
                                <p className="text-[10px] text-muted-foreground">{(att.size / 1024).toFixed(0)} KB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full text-primary hover:bg-primary/10 transition-colors">
                                <Eye className="h-4 w-4" />
                              </a>
                              <button type="button" onClick={() => removeAttachment(idx)} className="p-1.5 rounded-full text-destructive hover:bg-destructive/10 transition-colors">
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

          {/* العمود الجانبي */}
          <div className="space-y-8">
            <InfoCard title={isRtl ? "إرشادات" : "Guidelines"} icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {isRtl
                    ? "تأكد من إدخال جميع البيانات المطلوبة بدقة. الحقول المميزة بعلامة (*) إلزامية."
                    : "Ensure all required fields are filled accurately. Fields marked with (*) are mandatory."}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRtl
                    ? "يمكنك رفع عدة مرفقات (عقود، صور، مستندات) كمراجع إضافية."
                    : "You can upload multiple attachments (contracts, images, documents) as additional references."}
                </p>
              </div>
            </InfoCard>

            {/* حقل اختيار الفرع */}
            <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-4">
              <Label className="text-sm font-black text-muted-foreground/70 flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" /> {isRtl ? "الفرع *" : "Branch *"}
              </Label>
              <BranchSelector
                value={formData.branchId}
                onValueChange={(v) => setFormData({ ...formData, branchId: v })}
              />
              <p className="text-xs text-muted-foreground">
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
                className="flex-1 rounded-full border-primary text-primary hover:bg-primary/10 h-12 font-black"
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}