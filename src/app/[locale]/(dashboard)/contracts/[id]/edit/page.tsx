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
import { Save, X, Loader2, Calendar, Building, DollarSign, FileText } from "lucide-react";
import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { BranchSelector } from "@/components/shared/BranchSelector";

export default function EditContractPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const id = params.id as string;
  const t = useTranslations("Contracts");
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  });

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
        });
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
      };
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(t("updateSuccess"));
        // استخدام window.location.href لضمان العودة إلى قائمة العقود
        window.location.href = `/${locale}/contracts`;
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
                  <Label>{t("title")} *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t("titlePlaceholder")}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("supplier")} *</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder={t("supplierPlaceholder")}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{t("value")}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("code")}</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder={t("codePlaceholder")}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{t("startDate")} *</Label>
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
                    <Label>{t("endDate")} *</Label>
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
                  <Label>{t("description")}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t("descriptionPlaceholder")}
                    className="min-h-[100px] rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("notes")}</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t("notesPlaceholder")}
                    className="min-h-[100px] rounded-xl"
                  />
                </div>
              </div>
            </InfoCard>
          </div>
          <div className="space-y-6">
            <InfoCard title={t("branch")} icon={<Building className="h-5 w-5" />}>
              <div className="space-y-4">
                <BranchSelector value={formData.branchId} onValueChange={(val) => setFormData({ ...formData, branchId: val })} />
                <p className="text-xs text-muted-foreground">{t("branchHint")}</p>
              </div>
            </InfoCard>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 rounded-full border-red-500 text-red-500 hover:bg-red-50 h-12 font-black">
                <X className="h-4 w-4 ml-2" /> {t("cancel")}
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12">
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