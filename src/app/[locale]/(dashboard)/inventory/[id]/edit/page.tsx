"use client";

import {
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  useRouter,
  useParams,
} from "next/navigation";

import {
  useTranslations,
  useLocale,
} from "next-intl";

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
} from "lucide-react";

import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
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
        // ✅ التغيير المطلوب: التوجيه إلى صفحة القائمة بدلاً من التفاصيل
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
        icon={<Settings2 size={28} />}
        title={t("editTitle")}
        subtitle={t("editSubtitle")}
        actions={
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-full border-primary text-primary hover:bg-primary/10 font-black"
          >
            {isRtl ? "إلغاء" : "Cancel"}
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <InfoCard title={t("identity")} icon={<Package className="h-5 w-5" />}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground/70">
                    {t("name")} *
                  </Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("namePlaceholder")}
                    required
                    className="h-14 rounded-2xl border-primary bg-background focus-visible:ring-2 focus-visible:ring-primary font-bold text-lg px-6"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground/70">
                    {t("sku")} *
                  </Label>
                  <div className="relative">
                    <Hash className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
                    <Input
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder={t("skuPlaceholder")}
                      required
                      className="h-14 rounded-2xl border-primary bg-background pr-12 focus-visible:ring-2 focus-visible:ring-primary font-bold tracking-widest"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground/70">
                    {t("location")}
                  </Label>
                  <LocationSelector
                    value={selectedLocation}
                    onChange={handleLocationChange}
                  />
                </div>
              </div>
            </InfoCard>

            <InfoCard title={t("stockAndPricing")} icon={<BarChart3 className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground/70">{t("quantity")}</Label>
                  <Input
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="h-14 rounded-2xl border-primary bg-background font-black text-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-destructive/80">{t("minStockAlert")}</Label>
                  <Input
                    name="minQuantity"
                    type="number"
                    value={formData.minQuantity}
                    onChange={handleChange}
                    className="h-14 rounded-2xl border-primary bg-background font-black text-xl text-destructive"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-emerald-500/80">{t("unitPrice")}</Label>
                  <div className="relative">
                    <Banknote className="absolute right-4 top-4 h-5 w-5 text-emerald-500" />
                    <Input
                      name="unitPrice"
                      type="number"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={handleChange}
                      className="h-14 rounded-2xl border-primary bg-background pr-12 font-black text-xl text-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>

          <div className="space-y-8">
            <InfoCard title={t("notes")} icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-4">
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder={t("notesPlaceholder")}
                  className="rounded-2xl border-primary bg-background focus-visible:ring-2 focus-visible:ring-primary font-bold p-6 resize-none min-h-[120px]"
                />
                <div className="p-4 bg-primary/5 rounded-2xl flex items-start gap-3 border border-primary/10">
                  <Info className="h-4 w-4 text-primary/70 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-primary/70 leading-tight italic">
                    {t("auditNote")}
                  </p>
                </div>
              </div>
            </InfoCard>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 font-black"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {t("save")}
            </Button>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}