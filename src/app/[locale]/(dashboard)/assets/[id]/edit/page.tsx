// src/app/[locale]/(dashboard)/assets/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, MapPin, FileText, Loader2, ShieldCheck, Info, Globe, Save, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { LocationSelector, type LocationValue } from "@/components/shared/LocationSelector";
import type { AssetStatus, AssetType, Building, Floor, Room } from '@/types/assets';

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const assetId = params.id as string;
  const t = useTranslations('AssetsForm');
  const isRtl = locale === "ar";
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statuses, setStatuses] = useState<AssetStatus[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [selectedRoomFullCode, setSelectedRoomFullCode] = useState<string>("");
  const [selectedRoomName, setSelectedRoomName] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    typeId: "",
    statusId: "",
    purchaseDate: "",
    warrantyEnd: "",
    roomId: "",
    notes: "",
  });

  const containerClass = "bg-card border border-border rounded-md p-6 shadow-sm hover:shadow-md transition-all";

  // جلب البيانات الأساسية (الحالات، الأنواع، المباني)
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [statusesRes, typesRes, buildingsRes] = await Promise.all([
          fetch(`/api/asset-statuses?locale=${locale}`),
          fetch(`/api/asset-types?locale=${locale}`),
          fetch(`/api/buildings`),
        ]);
        if (statusesRes.ok) setStatuses(await statusesRes.json());
        if (typesRes.ok) setTypes(await typesRes.json());
        if (buildingsRes.ok) setBuildings(await buildingsRes.json());
      } catch (err) {
        toast.error(t('fetchError'));
      }
    };
    fetchMeta();
  }, [locale, t]);

  // جلب بيانات الأصل الحالي
  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await fetch(`/api/assets/${assetId}`);
        if (!res.ok) throw new Error("Asset not found");
        const asset = await res.json();
        setFormData({
          name: asset.name || "",
          nameEn: asset.nameEn || "",
          typeId: asset.typeId || "",
          statusId: asset.statusId || "",
          purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : "",
          warrantyEnd: asset.warrantyEnd ? asset.warrantyEnd.split('T')[0] : "",
          roomId: asset.roomId || "",
          notes: asset.notes || "",
        });
        if (asset.room) {
          setRoomId(asset.room.id);
          if (asset.room.floor) {
            setSelectedFloorId(asset.room.floor.id);
            if (asset.room.floor.building) setSelectedBuildingId(asset.room.floor.building.id);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error(t('fetchError'));
      } finally {
        setLoading(false);
      }
    };
    if (assetId) fetchAsset();
  }, [assetId, t]);

  // عند تغيير الموقع من LocationSelector
  const handleLocationChange = (location: LocationValue) => {
    setSelectedBuildingId(location.buildingId);
    setSelectedFloorId(location.floorId);
    setRoomId(location.roomId);
    setFormData(prev => ({ ...prev, roomId: location.roomId }));
  };

  // جلب تفاصيل الغرفة المختارة لعرض الكود والاسم
  useEffect(() => {
    if (!roomId) {
      setSelectedRoomFullCode("");
      setSelectedRoomName("");
      return;
    }
    const fetchRoomDetails = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (res.ok) {
          const roomData = await res.json();
          const buildingCode = roomData.floor?.building?.code || "";
          const floorCode = roomData.floor?.code || "";
          const roomCode = roomData.code || "";
          const fullCode = `${buildingCode}-${floorCode}-${roomCode}`;
          setSelectedRoomFullCode(fullCode);
          setSelectedRoomName(isRtl ? roomData.name : (roomData.nameEn || roomData.name));
        } else {
          // Fallback باستخدام المباني المحفوظة إذا فشل API (اختياري)
          setSelectedRoomFullCode("");
          setSelectedRoomName("");
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRoomDetails();
  }, [roomId, isRtl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTypeName = (typeId: string) => {
    const type = types.find(t => t.id === typeId);
    if (!type) return t('selectType');
    return isRtl ? type.name : (type.nameEn || type.name);
  };

  const getStatusName = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    if (!status) return t('selectStatus');
    return isRtl ? status.name : (status.nameEn || status.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(t('nameRequired'));
      return;
    }
    if (!roomId) {
      toast.error(t('locationRequired'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim() || null,
        typeId: formData.typeId || null,
        statusId: formData.statusId || null,
        purchaseDate: formData.purchaseDate || null,
        warrantyEnd: formData.warrantyEnd || null,
        roomId,
        notes: formData.notes || null,
      };
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(t('updateSuccess', { fallback: 'Asset updated successfully' }));
        router.push(`/${locale}/assets`);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || t('updateError'));
      }
    } catch (err) {
      toast.error(t('updateError'));
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
        title={t('editTitle', { fallback: isRtl ? "تعديل أصل" : "Edit Asset" })}
        subtitle={t('editSubtitle', { fallback: isRtl ? "تعديل بيانات الأصل" : "Edit asset details" })}
        actions={
          <Link
            href={`/${locale}/assets`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-md border border-border hover:bg-secondary transition-all duration-200 hover:scale-105"
            aria-label={isRtl ? "العودة إلى القائمة" : "Back to list"}
          >
            {isRtl ? <ArrowRight className="h-5 w-5 text-primary" /> : <ArrowLeft className="h-5 w-5 text-primary" />}
          </Link>
        }
      />
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <InfoCard title={t('basicInfo')} icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground/70">{t('name')} *</Label>
                  <Input name="name" value={formData.name} onChange={handleChange} placeholder={t('namePlaceholder')} required className="h-14 rounded-2xl border-primary bg-background focus-visible:ring-2 focus-visible:ring-primary font-bold text-lg px-6" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground/70 flex items-center gap-1"><Globe className="h-4 w-4" /> {t('nameEn')}</Label>
                  <Input name="nameEn" value={formData.nameEn} onChange={handleChange} placeholder={t('nameEnPlaceholder')} className="h-14 rounded-2xl border-primary bg-background focus-visible:ring-2 focus-visible:ring-primary font-bold text-lg px-6" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground/70">{t('type')}</Label>
                    <Select value={formData.typeId} onValueChange={(v) => handleSelectChange("typeId", v)} disabled={types.length === 0}>
                      <SelectTrigger className="w-full min-w-[180px] h-14 rounded-2xl border-primary bg-background font-black px-6">
                        {getTypeName(formData.typeId) || <SelectValue placeholder={t('selectType')} />}
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={type.id}>{isRtl ? type.name : (type.nameEn || type.name)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground/70">{t('status')}</Label>
                    <Select value={formData.statusId} onValueChange={(v) => handleSelectChange("statusId", v)} disabled={statuses.length === 0}>
                      <SelectTrigger className="w-full min-w-[180px] h-14 rounded-2xl border-primary bg-background font-black px-6">
                        {getStatusName(formData.statusId) || <SelectValue placeholder={t('selectStatus')} />}
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>{isRtl ? status.name : (status.nameEn || status.name)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className={containerClass}>
                  <div className="space-y-3">
                    <h3 className="text-foreground font-black text-lg uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={16} /> {t('location')}
                    </h3>
                    <LocationSelector
                      value={{
                        buildingId: selectedBuildingId,
                        floorId: selectedFloorId,
                        roomId,
                      }}
                      onChange={handleLocationChange}
                    />
                    {selectedRoomFullCode && (
                      <div className="mt-5 relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 p-4 shadow-lg">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-30" />
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {t('selectedRoom', { fallback: isRtl ? "الغرفة المختارة" : "Selected Room" })}
                          </span>
                          <span className="text-sm font-mono font-black text-primary tracking-wider">
                            {selectedRoomName} — {selectedRoomFullCode}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </InfoCard>

            <InfoCard title={t('lifecycle')} icon={<ShieldCheck className="h-5 w-5 text-emerald-500/70" />}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground/70">{t('purchaseDate')}</Label>
                  <div className="relative"><Calendar className="absolute right-4 top-4 h-5 w-5 text-muted-foreground/50" /><Input name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} className="h-14 rounded-2xl border-primary bg-background pr-12 focus-visible:ring-2 focus-visible:ring-primary font-black w-full" /></div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground/70">{t('warrantyEnd')}</Label>
                  <div className="relative"><ShieldCheck className="absolute right-4 top-4 h-5 w-5 text-emerald-500/70" /><Input name="warrantyEnd" type="date" value={formData.warrantyEnd} onChange={handleChange} className="h-14 rounded-2xl border-primary bg-background pr-12 focus-visible:ring-2 focus-visible:ring-emerald-500/50 font-black w-full" /></div>
                </div>
              </div>
            </InfoCard>
          </div>

          <div className="space-y-6">
            <InfoCard title={t('notes')} icon={<Info className="h-5 w-5" />}>
              <div className="space-y-4">
                <Textarea name="notes" value={formData.notes} onChange={handleChange} placeholder={t('notesPlaceholder')} className="rounded-2xl border-primary bg-background focus-visible:ring-2 focus-visible:ring-primary font-bold p-6 resize-none leading-relaxed min-h-[120px] w-full" />
                <div className="p-4 bg-primary/5 rounded-2xl flex items-start gap-3 border border-primary/10"><Info className="h-4 w-4 text-primary/70 shrink-0 mt-0.5" /><p className="text-[11px] font-bold text-primary/70 leading-tight italic">{t('infoText')}</p></div>
              </div>
            </InfoCard>
            <div className="flex gap-3">
              <Button type="button" onClick={() => router.back()} variant="outline" className="flex-1 rounded-full border-primary text-primary hover:bg-primary/10 h-12 font-black">{t('cancel') || (isRtl ? "إلغاء" : "Cancel")}</Button>
              <Button type="submit" disabled={saving} className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}{t('submit')}</Button>
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}