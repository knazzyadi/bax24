// src/app/[locale]/(dashboard)/tickets/[id]/edit/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, MapPin, User, Info, Save, X, Loader2, Image as ImageIcon, Upload, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { SidebarCard } from "@/components/shared/detail/SidebarCard";
import LocationSelector, { type LocationValue } from "@/components/shared/LocationSelector";
import { cn } from "@/lib/utils";

interface AssetType {
  id: string;
  name: string;
  nameEn?: string;
}

interface Asset {
  id: string;
  name: string;
  nameEn?: string;
  code: string;
}

export default function EditTicketPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const locale = useLocale();
  const t = useTranslations('TicketsForm');
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  // حالة الصورة
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [deletingImage, setDeletingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    type: "MAINTENANCE",
    title: "",
    description: "",
    assetTypeId: "",
    assetId: "",
    reporterName: "",
    reporterEmail: "",
    phone: "",
  });

  // جلب أنواع الأصول (مع AbortController)
  useEffect(() => {
    const controller = new AbortController();
    const fetchAssetTypes = async () => {
      try {
        const res = await fetch("/api/asset-types", { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setAssetTypes(data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("فشل جلب أنواع الأصول", err);
      }
    };
    fetchAssetTypes();
    return () => controller.abort();
  }, []);

  // جلب الأصول بناءً على الغرفة ونوع الأصل
  useEffect(() => {
    if (!roomId) {
      setAssets([]);
      return;
    }
    const controller = new AbortController();
    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        let url = `/api/assets?roomId=${roomId}`;
        if (formData.assetTypeId) url += `&typeId=${formData.assetTypeId}`;
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          const assetsList = data.assets || data;
          setAssets(assetsList);
        } else setAssets([]);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("فشل جلب الأصول", err);
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchAssets();
    return () => controller.abort();
  }, [roomId, formData.assetTypeId]);

  // جلب بيانات التذكرة (بما فيها الصورة)
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const fetchTicket = async () => {
      try {
        const res = await fetch(`/api/tickets/${id}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch ticket");
        const ticket = await res.json();
        const assetTypeId = ticket.asset?.typeId || "";

        setFormData({
          type: ticket.type || "MAINTENANCE",
          title: ticket.title || "",
          description: ticket.description || "",
          assetTypeId: assetTypeId,
          assetId: ticket.assetId || "",
          reporterName: ticket.reporterName || "",
          reporterEmail: ticket.reporterEmail || "",
          phone: ticket.phone || "",
        });

        // تعيين الصورة
        if (ticket.imageUrl) {
          setCurrentImageUrl(ticket.imageUrl);
        }

        if (ticket.room) {
          setRoomId(ticket.room.id);
          if (ticket.room.floor) {
            setSelectedFloorId(ticket.room.floor.id);
            if (ticket.room.floor.building) setSelectedBuildingId(ticket.room.floor.building.id);
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
        toast.error(t('fetchError'));
        router.push(`/${locale}/tickets`);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
    return () => controller.abort();
  }, [id, locale, router, t]);

  // معاينة الصورة عند اختيار ملف جديد
  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  // حذف الصورة (هذا يرسل طلب حذف للـ API، أو يمكن مسح currentImageUrl)
  const handleDeleteImage = async () => {
    if (!currentImageUrl) return;
    setDeletingImage(true);
    try {
      const res = await fetch(`/api/tickets/${id}/image`, { method: "DELETE" });
      if (res.ok) {
        setCurrentImageUrl("");
        toast.success(t("imageDeleted"));
      } else {
        throw new Error();
      }
    } catch {
      toast.error(t("imageDeleteError"));
    } finally {
      setDeletingImage(false);
    }
  };

  const handleLocationChange = (location: LocationValue) => {
    setSelectedBuildingId(location.buildingId);
    setSelectedFloorId(location.floorId);
    setRoomId(location.roomId);
    setFormData(prev => ({ ...prev, assetId: "", assetTypeId: "" }));
  };

  const getTicketTypeLabel = (typeValue: string) => {
    switch (typeValue) {
      case "MAINTENANCE": return t('type_maintenance');
      case "INCIDENT": return t('type_incident');
      default: return typeValue;
    }
  };

  const getAssetTypeLabel = (typeId: string) => {
    const assetType = assetTypes.find(t => t.id === typeId);
    if (!assetType) return "";
    return isRtl ? assetType.name : (assetType.nameEn || assetType.name);
  };

  const getAssetLabel = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return "";
    return isRtl ? asset.name : (asset.nameEn || asset.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.reporterName || !formData.reporterEmail) {
      toast.error(t('requiredFields'));
      return;
    }
    if (!roomId) {
      toast.error(t('locationRequired'));
      return;
    }

    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("type", formData.type);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("roomId", roomId);
      if (formData.assetId) formDataToSend.append("assetId", formData.assetId);
      formDataToSend.append("reporterName", formData.reporterName);
      formDataToSend.append("reporterEmail", formData.reporterEmail);
      if (formData.phone) formDataToSend.append("phone", formData.phone);
      
      // إذا كان هناك ملف جديد، استخدمه؛ وإذا تم الحفاظ على الصورة القديمة فلا نُرسل حقل الصورة
      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }
      // إذا تم حذف الصورة (currentImageUrl فارغة ولا يوجد ملف جديد)، يمكننا إرسال flag (اختياري)

      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        body: formDataToSend, // لا تضع Content-Type
      });
      if (res.ok) {
        toast.success(t('updateSuccess'));
        router.push(`/${locale}/tickets/${id}`);
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || t('updateError'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('connectionError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageContainer>
      <DetailHeader
        icon={<FileText size={28} />}
        title={t('editTitle')}
        subtitle={t('editSubtitle')}
        actions={null}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* تفاصيل التذكرة */}
            <InfoCard title={t('ticketDetails')} icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-6">
                {/* نوع البلاغ */}
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground">{t('type')} *</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                    <SelectTrigger className="h-14 rounded-2xl border-primary bg-background font-black px-6 w-full">
                      <SelectValue placeholder={t('selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAINTENANCE">{t('type_maintenance')}</SelectItem>
                      <SelectItem value="INCIDENT">{t('type_incident')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* العنوان */}
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground">{t('title')} *</Label>
                  <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-14 rounded-2xl border-primary bg-background font-bold text-lg px-6" />
                </div>

                {/* الوصف */}
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground">{t('description')} *</Label>
                  <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="rounded-2xl border-primary bg-background p-6 min-h-[120px]" />
                </div>

                {/* الموقع */}
                <div className="space-y-2 pt-4 border-t border-primary/20">
                  <Label className="text-sm font-black text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> {t('location')} *
                  </Label>
                  <LocationSelector
                    value={{ buildingId: selectedBuildingId, floorId: selectedFloorId, roomId }}
                    onChange={handleLocationChange}
                  />
                </div>

                {/* نوع الجهاز */}
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground">{t('assetType')}</Label>
                  <Select
                    value={formData.assetTypeId}
                    disabled={!roomId || assetTypes.length === 0}
                    onValueChange={(v) => setFormData({...formData, assetTypeId: v, assetId: ""})}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-primary bg-background font-black px-6 disabled:opacity-60 w-full">
                      <SelectValue placeholder={t('selectAssetType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('none')}</SelectItem>
                      {assetTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {isRtl ? type.name : (type.nameEn || type.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* اسم الجهاز */}
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground">{t('assetName')}</Label>
                  <Select
                    value={formData.assetId}
                    disabled={!roomId || loadingAssets}
                    onValueChange={(v) => setFormData({...formData, assetId: v})}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-primary bg-background font-black px-6 disabled:opacity-60 w-full">
                      <SelectValue placeholder={t('selectAsset')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('none')}</SelectItem>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {isRtl ? asset.name : (asset.nameEn || asset.name)} ({asset.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* العمود الجانبي (جهة الاتصال + الصورة) */}
          <div className="space-y-8">
            {/* معلومات مقدم البلاغ */}
            <SidebarCard title={t('reporterInfo')} icon={<User className="h-5 w-5" />}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground">{t('reporterName')} *</Label>
                  <Input required value={formData.reporterName} onChange={e => setFormData({...formData, reporterName: e.target.value})} className="h-14 rounded-2xl border-primary bg-background font-bold text-lg px-6" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground">{t('reporterEmail')} *</Label>
                  <Input type="email" required value={formData.reporterEmail} onChange={e => setFormData({...formData, reporterEmail: e.target.value})} className="h-14 rounded-2xl border-primary bg-background font-bold text-lg px-6" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground">{t('phone')}</Label>
                  <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-14 rounded-2xl border-primary bg-background font-bold text-lg px-6" />
                </div>
              </div>
            </SidebarCard>

            {/* بطاقة الصورة المرفقة */}
            <SidebarCard title={t('attachedImage') || "الصورة المرفقة"} icon={<ImageIcon className="h-5 w-5" />}>
              <div className="space-y-4">
                {/* عرض الصورة الحالية أو المعاينة */}
                {(currentImageUrl || imagePreview) && (
                  <div className="relative rounded-xl overflow-hidden border border-primary/30 bg-card">
                    <img
                      src={imagePreview || currentImageUrl}
                      alt="Ticket attachment"
                      className="w-full h-auto max-h-48 object-contain bg-muted/20"
                    />
                    {!imagePreview && currentImageUrl && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteImage}
                        disabled={deletingImage}
                        className="absolute top-2 right-2 rounded-full h-8 w-8 p-0 bg-destructive/80 hover:bg-destructive"
                      >
                        {deletingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                )}

                {/* زر رفع ملف جديد */}
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full justify-center gap-2 rounded-full border-primary text-primary hover:bg-primary/10 font-medium"
                  >
                    <Upload className="h-4 w-4" />
                    {imageFile ? t('changeImage') : t('uploadImage')}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        // إذا كان هناك صورة حالية، لا نحذفها تلقائياً حتى يتم حفظ التغيير
                      }
                    }}
                  />
                  {imageFile && (
                    <div className="text-xs text-muted-foreground text-center">
                      {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
                    </div>
                  )}
                </div>
              </div>
            </SidebarCard>

            {/* أزرار الإجراءات */}
            <div className="flex gap-3 pt-4">
              <Button type="button" onClick={() => router.back()} variant="outline" className="flex-1 rounded-full border-primary text-primary hover:bg-primary/10 h-12 font-black">
                <X className="h-4 w-4 ml-2" /> {t('cancel')}
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {t('save')}
              </Button>
            </div>

            {/* نص مساعد */}
            <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30 flex items-start gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs font-bold text-muted-foreground">{t('editHelpText')}</div>
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}