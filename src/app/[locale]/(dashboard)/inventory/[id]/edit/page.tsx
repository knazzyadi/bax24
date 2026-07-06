// src/app/[locale]/(dashboard)/inventory/[id]/edit/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Package,
  Hash,
  BarChart3,
  Banknote,
  FileText,
  Loader2,
  Save,
  Info,
  Settings2,
  ArrowLeft,
} from "lucide-react";
import {
  LocationSelector,
  type LocationValue,
} from "@/components/shared/LocationSelector";

type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

type InventoryForm = {
  name: string;
  sku: string;
  quantity: string;
  minQuantity: string;
  unitPrice: string;
  roomId: string;
  notes: string;
};

// =========================
// تنسيقات موحدة
// =========================
const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

export default function EditInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("Inventory");
  const isRtl = locale === "ar";
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<InventoryForm>({
    name: "",
    sku: "",
    quantity: "0",
    minQuantity: "5",
    unitPrice: "",
    roomId: "",
    notes: "",
  });

  const [selectedLocation, setSelectedLocation] = useState<LocationValue>({
    buildingId: "",
    floorId: "",
    roomId: "",
  });

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const fetchItem = async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/inventory/${id}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const data = await res.json();

        setFormData({
          name: data.name || "",
          sku: data.sku || "",
          quantity: data.quantity?.toString() || "0",
          minQuantity: data.minQuantity?.toString() || "5",
          unitPrice: data.unitPrice?.toString() || "",
          roomId: data.room?.id || "",
          notes: data.notes || "",
        });

        if (data.room) {
          const buildingId = data.room.floor?.building?.id || "";
          const floorId = data.room.floor?.id || "";
          const roomId = data.room.id || "";
          setSelectedLocation({
            buildingId,
            floorId,
            roomId,
          });
        } else {
          setSelectedLocation({ buildingId: "", floorId: "", roomId: "" });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        toast.error(t("fetchError"));
        router.push(`/${locale}/inventory`);
      } finally {
        setFetching(false);
      }
    };

    fetchItem();
    return () => controller.abort();
  }, [id, locale, router, t]);

  const handleChange = useCallback((e: ChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleLocationChange = useCallback((location: LocationValue) => {
    setSelectedLocation(location);
    setFormData((prev) => ({ ...prev, roomId: location.roomId }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error(t("nameSkuRequired"));
      return;
    }
    if (!formData.roomId) {
      toast.error(t("locationRequired"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          quantity: Number(formData.quantity) || 0,
          minQuantity: Number(formData.minQuantity) || 0,
          unitPrice: formData.unitPrice ? Number(formData.unitPrice) : null,
          roomId: formData.roomId,
          notes: formData.notes || null,
        }),
      });

      if (res.ok) {
        toast.success(t("updateSuccess"));
        router.push(`/${locale}/inventory`);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || t("updateError"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
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
            <Settings2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t("editTitle")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("editSubtitle")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          {isRtl ? "العودة" : "Back"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الرئيسي (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* بطاقة الهوية */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
                  <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("identity")}
                </h2>
              </div>

              <div className="space-y-5">
                {/* الاسم */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("name")} <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("namePlaceholder")}
                    required
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                  />
                </div>

                {/* SKU */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("sku")} <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Hash className="absolute right-3 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <Input
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder={t("skuPlaceholder")}
                      required
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4 pr-10 uppercase tracking-wider"
                    />
                  </div>
                </div>

                {/* الموقع */}
                <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                      <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100">
                      {t("location")} <span className="text-rose-500">*</span>
                    </h3>
                  </div>

                  <LocationSelector
                    value={selectedLocation}
                    onChange={handleLocationChange}
                  />
                </div>
              </div>
            </div>

            {/* بطاقة المخزون والتسعير */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                  <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("stockAndPricing")}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("quantity")}
                  </Label>
                  <Input
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-rose-600 dark:text-rose-400">
                    {t("minStockAlert")}
                  </Label>
                  <Input
                    name="minQuantity"
                    type="number"
                    value={formData.minQuantity}
                    onChange={handleChange}
                    className="h-12 rounded-xl border-rose-200 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20 focus:ring-2 focus:ring-rose-500/50 transition-all text-base px-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {t("unitPrice")}
                  </Label>
                  <div className="relative">
                    <Banknote className="absolute right-3 top-3.5 h-5 w-5 text-emerald-400 dark:text-emerald-500" />
                    <Input
                      name="unitPrice"
                      type="number"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={handleChange}
                      className="h-12 rounded-xl border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 focus:ring-2 focus:ring-emerald-500/50 transition-all text-base px-4 pr-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* العمود الجانبي (1/3) */}
          <div className="space-y-6">
            {/* بطاقة الملاحظات */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("notes")}
                </h3>
              </div>

              <div className="space-y-4">
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder={t("notesPlaceholder")}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[120px] resize-none"
                />
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/30 flex items-start gap-3">
                  <Info className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("auditNote")}
                  </p>
                </div>
              </div>
            </div>

            {/* مساعدة سريعة */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
              <Info className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                {isRtl
                  ? "تأكد من تحديث جميع الحقول المطلوبة قبل الحفظ."
                  : "Make sure to update all required fields before saving."}
              </div>
            </div>

            {/* الأزرار */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 ml-2" />}
              {t("save")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}