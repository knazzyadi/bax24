// src/app/[locale]/(dashboard)/maintenance/[id]/edit/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Info, Loader2, MapPin, Building, Layers, DoorOpen, AlertCircle,
  FileText, Calendar, Save, X, Check, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { FormPageContainer } from "@/components/shared/form/FormPageContainer";
import { FormSection } from "@/components/shared/form/FormSection";
import { FormSidebar } from "@/components/shared/form/FormSidebar";
import { FormField } from "@/components/shared/form/FormField";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
import { BranchSelector } from "@/components/shared/BranchSelector";
import { AssetTypeField } from "@/components/shared/form/AssetTypeField";

// --- تعريف الأنواع ---
interface Building { id: string; name: string; nameEn?: string; code?: string; }
interface Floor { id: string; name: string; nameEn?: string; code?: string; buildingId: string; }
interface Room { id: string; name: string; nameEn?: string; code?: string; floorId: string; buildingId?: string; fullCode?: string; }
interface AssetType { id: string; name: string; nameEn?: string; }
interface Asset { id: string; name: string; nameEn?: string; code: string; }

type LocationLevel = 'building' | 'floor' | 'room';

function frequencyToDays(freq: string): number {
  switch (freq) {
    case "MONTHLY": return 30;
    case "QUARTERLY": return 90;
    case "SEMI_ANNUAL": return 180;
    case "YEARLY": return 365;
    default: return 30;
  }
}

export default function EditMaintenanceSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("MaintenanceForm");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- بيانات النموذج ---
  const [formData, setFormData] = useState({
    name: "",
    frequency: "MONTHLY",
    frequencyDays: 30,
    leadDays: 30,
    startDate: "",
    assetTypeId: "",
    notes: "",
    isActive: true,
  });

  // --- بيانات الموقع ---
  const [branchId, setBranchId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [locationLevel, setLocationLevel] = useState<LocationLevel>("building");

  // --- القوائم ---
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [tempSelectedAssetIds, setTempSelectedAssetIds] = useState<string[]>([]);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);

  // --- حالات التحميل الجزئية ---
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const containerClass = "bg-card border border-border rounded-md p-6 shadow-sm hover:shadow-md transition-all";

  // 1. تحميل البيانات الرئيسية (أنواع الأصول والمباني)
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const [assetTypesRes, buildingsRes] = await Promise.all([
          fetch("/api/asset-types", { signal: controller.signal }),
          fetch("/api/buildings", { signal: controller.signal }),
        ]);
        if (assetTypesRes.ok) setAssetTypes(await assetTypesRes.json());
        if (buildingsRes.ok) setBuildings(await buildingsRes.json());
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
      } finally {
        setLoadingMaster(false);
      }
    })();
    return () => controller.abort();
  }, []);

  // 2. تحميل بيانات جدول الصيانة (بعد الانتهاء من البيانات الرئيسية تقريباً)
  useEffect(() => {
    if (loadingMaster) return; // ننتظر حتى نحمل المباني وأنواع الأصول
    if (!id) return;

    const controller = new AbortController();
    (async () => {
      setLoadingSchedule(true);
      try {
        const res = await fetch(`/api/maintenance/schedules/${id}`, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const data = await res.json();

        // تعبئة النموذج الأساسي
        setFormData({
          name: data.name || "",
          frequency: data.frequency || "MONTHLY",
          frequencyDays: data.frequencyDays || frequencyToDays(data.frequency),
          leadDays: data.leadDays || 30,
          startDate: data.startDate?.split("T")[0] || "",
          assetTypeId: data.assetTypeId || "",
          notes: data.notes || "",
          isActive: data.isActive ?? true,
        });

        // تعيين الفرع والموقع
        setBranchId(data.branchId || "");

        const bId = data.buildingId || "";
        const fId = data.floorId || "";
        const rId = data.roomId || "";

        setBuildingId(bId);
        setFloorId(fId);
        setRoomId(rId);

        // تحديد مستوى الموقع
        if (rId) setLocationLevel("room");
        else if (fId) setLocationLevel("floor");
        else if (bId) setLocationLevel("building");

        // تعيين الأصول المرتبطة
        const assetIds = data.scheduleAssets?.map((a: any) => a.assetId) || [];
        setSelectedAssetIds(assetIds);
        setTempSelectedAssetIds(assetIds);

        setLoadingSchedule(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
        toast.error(t("fetchError"));
        router.push(`/${locale}/maintenance`);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id, loadingMaster, locale, router, t]);

  // 3. تحميل الأدوار عند تغيير buildingId (بعد تحميل بيانات الجدول)
  useEffect(() => {
    if (!buildingId) {
      setFloors([]);
      return;
    }
    const controller = new AbortController();
    (async () => {
      setLoadingFloors(true);
      try {
        const res = await fetch(`/api/buildings/${buildingId}/floors`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setFloors(data);
        } else setFloors([]);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
      } finally {
        setLoadingFloors(false);
      }
    })();
    return () => controller.abort();
  }, [buildingId]);

  // 4. تحميل الغرف عند تغيير floorId
  useEffect(() => {
    if (!floorId) {
      setRooms([]);
      return;
    }
    const controller = new AbortController();
    (async () => {
      setLoadingRooms(true);
      try {
        const res = await fetch(`/api/floors/${floorId}/rooms`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          // يمكن إضافة fullCode هنا إذا أردت
          setRooms(data);
        } else setRooms([]);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
      } finally {
        setLoadingRooms(false);
      }
    })();
    return () => controller.abort();
  }, [floorId]);

  // 5. تحميل الأصول بناءً على نوع الأصل والموقع المحدد
  useEffect(() => {
    // لا تحمل إذا لم يتم تحديد نوع الأصل أو لم يكتمل تحميل الجدول بعد
    if (!formData.assetTypeId) {
      setAssets([]);
      return;
    }
    // يجب أن يكون الموقع محدداً على المستوى المناسب
    let locationParam = "";
    if (locationLevel === "room" && roomId) locationParam = `roomId=${roomId}`;
    else if (locationLevel === "floor" && floorId) locationParam = `floorId=${floorId}`;
    else if (locationLevel === "building" && buildingId) locationParam = `buildingId=${buildingId}`;
    else return; // لم يتم تحديد موقع بعد

    const controller = new AbortController();
    (async () => {
      setLoadingAssets(true);
      try {
        const url = `/api/assets?typeId=${formData.assetTypeId}&${locationParam}&branchId=${branchId}`;
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setAssets(data.assets || []);
        } else setAssets([]);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
      } finally {
        setLoadingAssets(false);
      }
    })();
    return () => controller.abort();
  }, [formData.assetTypeId, locationLevel, buildingId, floorId, roomId, branchId]);

  // دوال مساعدة
  const isLocationSelected = () => {
    if (locationLevel === "room") return !!roomId;
    if (locationLevel === "floor") return !!floorId;
    return !!buildingId;
  };

  const getSelectedLocationSummary = () => {
    if (locationLevel === "room" && roomId) {
      const room = rooms.find(r => r.id === roomId);
      return room ? (isRtl ? room.name : room.nameEn || room.name) : t("room");
    }
    if (locationLevel === "floor" && floorId) {
      const floor = floors.find(f => f.id === floorId);
      return floor ? (isRtl ? floor.name : floor.nameEn || floor.name) : t("floor");
    }
    if (locationLevel === "building" && buildingId) {
      const building = buildings.find(b => b.id === buildingId);
      return building ? (isRtl ? building.name : building.nameEn || building.name) : t("building");
    }
    return t("notSelected");
  };

  const openAssetDialog = () => {
    setTempSelectedAssetIds([...selectedAssetIds]);
    setAssetDialogOpen(true);
  };

  const confirmAssetSelection = () => {
    setSelectedAssetIds(tempSelectedAssetIds);
    setAssetDialogOpen(false);
  };

  const removeAsset = (assetId: string) => {
    setSelectedAssetIds(prev => prev.filter(id => id !== assetId));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    if (!isLocationSelected()) {
      toast.error(t("locationRequired"));
      return;
    }
    if (!branchId) {
      toast.error(t("branchRequired"));
      return;
    }
    if (!formData.assetTypeId && selectedAssetIds.length === 0) {
      toast.error(t("assetTypeOrAssetsRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        frequency: formData.frequency,
        frequencyDays: formData.frequencyDays || frequencyToDays(formData.frequency),
        leadDays: formData.leadDays,
        startDate: formData.startDate || null,
        branchId,
        assetTypeId: formData.assetTypeId || null,
        assetIds: selectedAssetIds,
        notes: formData.notes,
        isActive: formData.isActive,
      };
      if (locationLevel === "room" && roomId) payload.roomId = roomId;
      else if (locationLevel === "floor" && floorId) payload.floorId = floorId;
      else if (locationLevel === "building" && buildingId) payload.buildingId = buildingId;

      const res = await fetch(`/api/maintenance/schedules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(t("updateSuccess"));
        router.push(`/${locale}/maintenance`);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || t("updateError"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- حالة التحميل العامة ---
  if (loading || loadingMaster || loadingSchedule) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <FormPageContainer
      icon={<Calendar size={28} />}
      title={t("editTitle")}
      subtitle={t("editSubtitle")}
    >
      <div className="lg:col-span-2 space-y-8">
        {/* معلومات أساسية (مبسطة لكن كاملة) */}
        <FormSection icon={<AlertCircle size={16} />} title={t("basicInfo")}>
          <div className="grid md:grid-cols-2 gap-6">
            <FormField label={t("name")} required>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("namePlaceholder")}
                className="h-12 rounded-xl font-medium"
              />
            </FormField>
            <FormField label={t("frequency")}>
              <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder={t("selectFrequency")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">{t("monthly")}</SelectItem>
                  <SelectItem value="QUARTERLY">{t("quarterly")}</SelectItem>
                  <SelectItem value="SEMI_ANNUAL">{t("semiAnnual")}</SelectItem>
                  <SelectItem value="YEARLY">{t("yearly")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-4">
            <FormField label={t("frequencyDays")}>
              <Input type="number" min={1} value={formData.frequencyDays} onChange={(e) => setFormData({ ...formData, frequencyDays: parseInt(e.target.value) || 0 })} />
            </FormField>
            <FormField label={t("leadDays")}>
              <Input type="number" value={formData.leadDays} onChange={(e) => setFormData({ ...formData, leadDays: parseInt(e.target.value) || 0 })} />
            </FormField>
            <FormField label={t("startDate")}>
              <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </FormField>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
            <Label htmlFor="isActive" className="cursor-pointer">{t("active")}</Label>
          </div>
        </FormSection>

        {/* الموقع */}
        <div className={containerClass}>
          <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
            <MapPin size={18} /> {t("location")}
          </h3>
          <div className="flex gap-2 mb-4">
            <label className="flex items-center gap-1"><input type="radio" name="locLevel" checked={locationLevel === "building"} onChange={() => setLocationLevel("building")} /> مبنى</label>
            <label className="flex items-center gap-1"><input type="radio" name="locLevel" checked={locationLevel === "floor"} onChange={() => setLocationLevel("floor")} /> دور</label>
            <label className="flex items-center gap-1"><input type="radio" name="locLevel" checked={locationLevel === "room"} onChange={() => setLocationLevel("room")} /> غرفة</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <BranchSelector value={branchId} onValueChange={setBranchId} />
            <BuildingSelector value={buildingId} onValueChange={(val) => { setBuildingId(val); setFloorId(""); setRoomId(""); }} buildings={buildings} loading={loadingMaster} />
            {(locationLevel === "floor" || locationLevel === "room") && (
              <FloorSelector value={floorId} onValueChange={(val) => { setFloorId(val); setRoomId(""); }} floors={floors} buildingId={buildingId} loading={loadingFloors} />
            )}
            {locationLevel === "room" && (
              <RoomSelector value={roomId} onValueChange={setRoomId} rooms={rooms} floorId={floorId} loading={loadingRooms} />
            )}
          </div>
          {isLocationSelected() && (
            <div className="mt-5 p-3 bg-primary/10 rounded-xl border border-primary/30">
              <span className="font-semibold">{t("selectedLocation")}:</span> {getSelectedLocationSummary()}
            </div>
          )}
        </div>

        {/* الأصول */}
        <div className={containerClass}>
          <h3 className="text-lg font-bold mb-4">{t("assets")}</h3>
          <AssetTypeField
            value={formData.assetTypeId}
            onChange={(val) => setFormData(prev => ({ ...prev, assetTypeId: val || "" }))}
            assetTypes={assetTypes}
            disabled={!isLocationSelected()}
          />
          <Button type="button" variant="outline" onClick={openAssetDialog} disabled={!formData.assetTypeId || assets.length === 0} className="mt-4 w-full">
            <Plus className="h-4 w-4 mr-2" /> {selectedAssetIds.length > 0 ? `${selectedAssetIds.length} أصل محدد` : t("selectAssets")}
          </Button>
          {selectedAssetIds.length > 0 && (
            <div className="mt-4 space-y-2">
              {selectedAssetIds.map(assetId => {
                const asset = assets.find(a => a.id === assetId);
                if (!asset) return null;
                return (
                  <div key={assetId} className="flex justify-between items-center p-2 border rounded">
                    <span>{isRtl ? asset.name : asset.nameEn || asset.name}</span>
                    <button type="button" onClick={() => removeAsset(assetId)} className="text-red-500"><X size={16} /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* شريط جانبي للحفظ */}
      <FormSidebar>
        <div className="space-y-3">
          <Label>{t("notes")}</Label>
          <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder={t("notesPlaceholder")} rows={3} />
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={() => router.back()} variant="outline" className="flex-1">{t("cancel")}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 gap-2">
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />} {t("save")}
          </Button>
        </div>
        <div className="mt-4 p-3 bg-primary/10 rounded-lg text-xs text-muted-foreground flex gap-2">
          <Info size={14} /> {t("infoText")}
        </div>
      </FormSidebar>

      {/* حوار اختيار الأصول */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>{t("selectAssets")}</DialogTitle></DialogHeader>
          {loadingAssets ? <Loader2 className="animate-spin mx-auto" /> : (
            assets.map(asset => (
              <label key={asset.id} className="flex items-center gap-2">
                <input type="checkbox" checked={tempSelectedAssetIds.includes(asset.id)} onChange={(e) => {
                  if (e.target.checked) setTempSelectedAssetIds(prev => [...prev, asset.id]);
                  else setTempSelectedAssetIds(prev => prev.filter(id => id !== asset.id));
                }} />
                <span>{isRtl ? asset.name : asset.nameEn || asset.name}</span> <span className="text-xs text-muted-foreground">({asset.code})</span>
              </label>
            ))
          )}
          <Button onClick={confirmAssetSelection} className="mt-4"><Check /> تأكيد</Button>
        </DialogContent>
      </Dialog>
    </FormPageContainer>
  );
}