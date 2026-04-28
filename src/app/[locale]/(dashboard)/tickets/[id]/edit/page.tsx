"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, MapPin, User, Info, Save, X, Loader2 } from "lucide-react";
import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { SidebarCard } from "@/components/shared/detail/SidebarCard";
import LocationSelector, { type LocationValue } from "@/components/shared/LocationSelector";

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

  // جلب أنواع الأصول
  useEffect(() => {
    const fetchAssetTypes = async () => {
      try {
        const res = await fetch("/api/asset-types");
        if (res.ok) {
          const data = await res.json();
          setAssetTypes(data);
        }
      } catch (err) {
        console.error("فشل جلب أنواع الأصول");
      }
    };
    fetchAssetTypes();
  }, []);

  // جلب الأصول بناءً على الغرفة ونوع الأصل
  useEffect(() => {
    if (!roomId) {
      setAssets([]);
      return;
    }
    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        let url = `/api/assets?roomId=${roomId}`;
        if (formData.assetTypeId) {
          url += `&typeId=${formData.assetTypeId}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          // يتوقع أن API الأصول يعيد مصفوفة تحت مفتاح assets أو مباشرة
          const assetsList = data.assets || data;
          setAssets(assetsList);
        } else {
          setAssets([]);
        }
      } catch (err) {
        console.error("فشل جلب الأصول", err);
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchAssets();
  }, [roomId, formData.assetTypeId]);

  // جلب بيانات التذكرة
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await fetch(`/api/tickets/${id}`);
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

        if (ticket.room) {
          setRoomId(ticket.room.id);
          if (ticket.room.floor) {
            setSelectedFloorId(ticket.room.floor.id);
            if (ticket.room.floor.building) setSelectedBuildingId(ticket.room.floor.building.id);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error(t('fetchError'));
        router.push(`/${locale}/tickets`);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTicket();
  }, [id, locale, router, t]);

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
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title,
          description: formData.description,
          roomId: roomId,
          assetId: formData.assetId || null,
          reporterName: formData.reporterName,
          reporterEmail: formData.reporterEmail,
          phone: formData.phone || null,
        }),
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
            <InfoCard title={t('ticketDetails')} icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-6">
                {/* نوع البلاغ */}
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground">{t('type')} *</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                    <SelectTrigger className="h-14 rounded-2xl border-primary bg-background font-black px-6 w-full">
                      {getTicketTypeLabel(formData.type)}
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
                      {formData.assetTypeId ? getAssetTypeLabel(formData.assetTypeId) : <span className="text-muted-foreground">{t('selectAssetType')}</span>}
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

                {/* اسم الجهاز - استخدم Select محلي بدلاً من AssetSelector */}
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground">{t('assetName')}</Label>
                  <Select
                    value={formData.assetId}
                    disabled={!roomId || loadingAssets}
                    onValueChange={(v) => setFormData({...formData, assetId: v})}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-primary bg-background font-black px-6 disabled:opacity-60 w-full">
                      {formData.assetId ? getAssetLabel(formData.assetId) : <span className="text-muted-foreground">{t('selectAsset')}</span>}
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

          <div className="space-y-8">
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

                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button type="button" onClick={() => router.back()} variant="outline" className="flex-1 rounded-full border-primary text-primary hover:bg-primary/10 h-12 font-black">
                    <X className="h-4 w-4 ml-2" /> {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12">
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {t('save')}
                  </Button>
                </div>
              </div>
            </SidebarCard>

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