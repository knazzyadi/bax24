// src/app/[locale]/(dashboard)/maintenance/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  Info, Loader2, MapPin, Building, Layers, DoorOpen, AlertCircle, FileText, Calendar, Save, X, Check, Plus
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

// تعريف الأنواع
interface Building {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

interface Floor {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  buildingId: string;
}

interface Room {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  floorId: string;
  buildingId?: string;
  fullCode?: string;
}

interface AssetType { id: string; name: string; nameEn?: string; }
interface Asset { id: string; name: string; code: string; nameEn?: string; }

type LocationLevel = 'building' | 'floor' | 'room';

export default function EditMaintenanceSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations('MaintenanceForm');
  const { data: session } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // بيانات أنواع الأصول والأصول
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // حالة الموقع الهرمي
  const [branchId, setBranchId] = useState<string>("");
  const [buildingId, setBuildingId] = useState<string>("");
  const [floorId, setFloorId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  
  // مستوى التحديد (مبنى / دور / غرفة)
  const [locationLevel, setLocationLevel] = useState<LocationLevel>('building');

  // بيانات المباني والأدوار والغرف
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // حوار اختيار الأصول
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [tempSelectedAssetIds, setTempSelectedAssetIds] = useState<string[]>([]);

  // بيانات النموذج الأساسية
  const [formData, setFormData] = useState({
    name: "",
    frequency: "MONTHLY",
    leadDays: 30,
    startDate: "",
    assetTypeId: "",
    notes: "",
    isActive: true,
  });

  const containerClass = "bg-card border border-border rounded-md p-6 shadow-sm hover:shadow-md transition-all";

  // جلب البيانات الأولية (أنواع الأصول والمباني)
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [assetTypesRes, buildingsRes] = await Promise.all([
          fetch("/api/asset-types"),
          fetch("/api/buildings"),
        ]);
        if (assetTypesRes.ok) setAssetTypes(await assetTypesRes.json());
        if (buildingsRes.ok) setBuildings(await buildingsRes.json());
      } catch (error) {
        console.error(error);
        toast.error(t("fetchError"));
      } finally {
        setLoadingBuildings(false);
        setDataLoaded(true);
      }
    }
    fetchInitialData();
  }, [t]);

  // جلب بيانات الجدول الحالي
  useEffect(() => {
    async function fetchSchedule() {
      if (!id) return;
      try {
        const res = await fetch(`/api/maintenance/schedules/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setFormData({
          name: data.name,
          frequency: data.frequency,
          leadDays: data.leadDays,
          startDate: data.startDate ? data.startDate.split('T')[0] : "",
          assetTypeId: data.assetTypeId || "",
          notes: data.notes || "",
          isActive: data.isActive,
        });
        // تعيين الموقع
        if (data.buildingId) {
          setBuildingId(data.buildingId);
          setLocationLevel('building');
        } else if (data.floorId) {
          setFloorId(data.floorId);
          setLocationLevel('floor');
        } else if (data.roomId) {
          setRoomId(data.roomId);
          setLocationLevel('room');
        }
        if (data.branchId) setBranchId(data.branchId);
        // جلب الأصول المحددة (من scheduleAssets)
        if (data.scheduleAssets && data.scheduleAssets.length) {
          const assetIds = data.scheduleAssets.map((sa: any) => sa.assetId);
          setSelectedAssetIds(assetIds);
        }
      } catch (error) {
        console.error(error);
        toast.error(t("fetchError"));
        router.push(`/${locale}/maintenance`);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, [id, locale, router, t]);

  // جلب الأدوار عند تغيير المبنى
  useEffect(() => {
    if (!buildingId) {
      setFloors([]);
      return;
    }
    async function fetchFloors() {
      setLoadingFloors(true);
      try {
        const res = await fetch(`/api/buildings/${buildingId}/floors`);
        if (res.ok) {
          const data = await res.json();
          setFloors(data);
        } else setFloors([]);
      } catch {
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    }
    fetchFloors();
  }, [buildingId]);

  // جلب الغرف عند تغيير الدور
  useEffect(() => {
    if (!floorId) {
      setRooms([]);
      return;
    }
    async function fetchRooms() {
      setLoadingRooms(true);
      try {
        const res = await fetch(`/api/floors/${floorId}/rooms`);
        if (res.ok) {
          const data = await res.json();
          const currentBuilding = buildings.find(b => b.id === buildingId);
          const currentFloor = floors.find(f => f.id === floorId);
          const buildingCode = currentBuilding?.code || '';
          const floorCode = currentFloor?.code || '';
          const roomsWithCode = data.map((room: any) => ({
            id: room.id,
            name: room.name,
            nameEn: room.nameEn,
            code: room.code,
            floorId,
            buildingId,
            fullCode: `${buildingCode}-${floorCode}-${room.code || ''}`,
          }));
          setRooms(roomsWithCode);
        } else setRooms([]);
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    }
    fetchRooms();
  }, [floorId, buildingId, buildings, floors]);

  // جلب الأصول بناءً على المستوى المحدد ونوع الأصل
  useEffect(() => {
    const hasAssetType = formData.assetTypeId && formData.assetTypeId !== "";
    if (!hasAssetType) {
      setAssets([]);
      return;
    }

    let canFetch = false;
    let params = new URLSearchParams();
    params.append("typeId", formData.assetTypeId);
    params.append("branchId", branchId);

    if (locationLevel === 'room' && roomId) {
      params.append("roomId", roomId);
      canFetch = true;
    } else if (locationLevel === 'floor' && floorId) {
      params.append("floorId", floorId);
      canFetch = true;
    } else if (locationLevel === 'building' && buildingId) {
      params.append("buildingId", buildingId);
      canFetch = true;
    }

    if (!canFetch) {
      setAssets([]);
      return;
    }

    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        const res = await fetch(`/api/assets?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setAssets(data.assets || []);
        } else setAssets([]);
      } catch {
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchAssets();
  }, [buildingId, floorId, roomId, formData.assetTypeId, branchId, locationLevel]);

  // فتح حوار اختيار الأصول
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
    let locationValid = false;
    if (locationLevel === 'room' && roomId) locationValid = true;
    else if (locationLevel === 'floor' && floorId) locationValid = true;
    else if (locationLevel === 'building' && buildingId) locationValid = true;
    
    if (!locationValid) {
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
        leadDays: formData.leadDays,
        startDate: formData.startDate || null,
        branchId,
        assetTypeId: formData.assetTypeId || null,
        assetIds: selectedAssetIds,
        notes: formData.notes,
        isActive: formData.isActive,
      };
      if (locationLevel === 'room' && roomId) payload.roomId = roomId;
      else if (locationLevel === 'floor' && floorId) payload.floorId = floorId;
      else if (locationLevel === 'building' && buildingId) payload.buildingId = buildingId;

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

  if (loading || !dataLoaded || loadingBuildings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getSelectedLocationSummary = () => {
    if (locationLevel === 'room' && roomId) {
      const room = rooms.find(r => r.id === roomId);
      return room ? `${room.name} (${room.fullCode})` : t("room");
    }
    if (locationLevel === 'floor' && floorId) {
      const floor = floors.find(f => f.id === floorId);
      return floor ? floor.name : t("floor");
    }
    if (locationLevel === 'building' && buildingId) {
      const building = buildings.find(b => b.id === buildingId);
      return building ? building.name : t("building");
    }
    return t("notSelected");
  };

  const isLocationSelected = () => {
    if (locationLevel === 'room') return !!roomId;
    if (locationLevel === 'floor') return !!floorId;
    if (locationLevel === 'building') return !!buildingId;
    return false;
  };

  return (
    <FormPageContainer
      icon={<Calendar size={28} />}
      title={t("editTitle")}
      subtitle={t("editSubtitle")}
    >
      {/* العمود الرئيسي - الأيسر */}
      <div className="lg:col-span-2 space-y-8">
        {/* 1. معلومات أساسية */}
        <FormSection icon={<AlertCircle size={16} />} title={t("basicInfo")}>
          <div className="grid md:grid-cols-2 gap-6">
            <FormField label={t("name")} required>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("namePlaceholder")}
                className="h-12 rounded-xl"
              />
            </FormField>
            <FormField label={t("frequency")}>
              <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
            <SelectTrigger className="h-12 rounded-xl">
                {formData.frequency === "DAILY" ? t("daily") :
                formData.frequency === "WEEKLY" ? t("weekly") :
                formData.frequency === "MONTHLY" ? t("monthly") :
                formData.frequency === "YEARLY" ? t("yearly") :
                <SelectValue placeholder={t("selectFrequency")} />}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="DAILY">{t("daily")}</SelectItem>
                <SelectItem value="WEEKLY">{t("weekly")}</SelectItem>
                <SelectItem value="MONTHLY">{t("monthly")}</SelectItem>
                <SelectItem value="YEARLY">{t("yearly")}</SelectItem>
            </SelectContent>
            </Select>
            </FormField>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-4">
            <FormField label={t("leadDays")}>
              <Input
                type="number"
                value={formData.leadDays}
                onChange={(e) => setFormData({ ...formData, leadDays: parseInt(e.target.value) || 0 })}
                className="h-12 rounded-xl"
              />
            </FormField>
            <FormField label={t("startDate")}>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="h-12 rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">{t("startDateHint")}</p>
            </FormField>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="cursor-pointer font-black">
                  {t("active")}
                </Label>
              </div>
            </div>
          </div>
        </FormSection>

        {/* 2. حاوية الموقع */}
        <div className={containerClass}>
          <div className="space-y-3">
            <h3 className="text-foreground font-black text-lg uppercase tracking-widest flex items-center gap-2">
              <MapPin size={16} /> {isRtl ? 'تفاصيل الموقع' : 'Location Details'}
              <span className="text-red-500 text-sm">*</span>
            </h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="building"
                  checked={locationLevel === 'building'}
                  onChange={() => setLocationLevel('building')}
                />
                <span>{isRtl ? "مبنى" : "Building"}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="floor"
                  checked={locationLevel === 'floor'}
                  onChange={() => setLocationLevel('floor')}
                />
                <span>{isRtl ? "دور" : "Floor"}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="room"
                  checked={locationLevel === 'room'}
                  onChange={() => setLocationLevel('room')}
                />
                <span>{isRtl ? "غرفة" : "Room"}</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground/70 flex items-center gap-1">
                  <Building size={12} /> {isRtl ? "الفرع" : "Branch"}
                </Label>
                <BranchSelector value={branchId} onValueChange={(val) => { setBranchId(val); setBuildingId(""); setFloorId(""); setRoomId(""); }} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground/70 flex items-center gap-1">
                  <Building size={12} /> {isRtl ? "المبنى أو المنطقة" : "Building / Zone"}
                </Label>
                <div className="relative">
                  <BuildingSelector
                    value={buildingId}
                    onValueChange={(val) => { setBuildingId(val); setFloorId(""); setRoomId(""); }}
                    buildings={buildings}
                    loading={loadingBuildings}
                  />
                  {!branchId && (
                    <div className="absolute inset-0 bg-background/50 rounded-md cursor-not-allowed z-10" />
                  )}
                </div>
              </div>
              {(locationLevel === 'floor' || locationLevel === 'room') && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground/70 flex items-center gap-1">
                    <Layers size={12} /> {isRtl ? "الدور أو المنطقة" : "Floor / Zone"}
                  </Label>
                  <FloorSelector
                    value={floorId}
                    onValueChange={(val) => { setFloorId(val); setRoomId(""); }}
                    floors={floors}
                    buildingId={buildingId}
                    loading={loadingFloors}
                  />
                </div>
              )}
              {locationLevel === 'room' && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground/70 flex items-center gap-1">
                    <DoorOpen size={12} /> {isRtl ? "الوحدة" : "Unit"}
                  </Label>
                  <RoomSelector
                    value={roomId}
                    onValueChange={setRoomId}
                    rooms={rooms}
                    floorId={floorId}
                    loading={loadingRooms}
                  />
                </div>
              )}
            </div>
            {isLocationSelected() && (
              <div className="mt-5 relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 p-4 shadow-lg">
                <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-30" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {isRtl ? "الموقع المختار" : "Selected Location"}
                  </span>
                  <span className="text-sm font-mono font-black text-primary tracking-wider">
                    {getSelectedLocationSummary()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. حاوية الأصل */}
        <div className={containerClass}>
          <h3 className="text-foreground font-black text-lg uppercase tracking-widest flex items-center gap-2">
            <FileText size={16} /> {isRtl ? 'بيانات الأصل (اختياري)' : 'Asset Details (Optional)'}
          </h3>
          <div className="space-y-4 mt-3">
            <AssetTypeField
              value={formData.assetTypeId}
              onChange={(val) => setFormData(prev => ({ ...prev, assetTypeId: val ?? "" }))}
              assetTypes={assetTypes}
              disabled={!isLocationSelected()}
              placeholder={isLocationSelected() ? (isRtl ? "اختر نوع الأصل" : "Select asset type") : (isRtl ? "اختر الموقع أولاً" : "Select location first")}
            />

            <div className="space-y-2">
              <Label className="text-sm font-black text-muted-foreground">{t("selectAssets")}</Label>
              <Button
                type="button"
                variant="outline"
                onClick={openAssetDialog}
                disabled={!isLocationSelected() || !formData.assetTypeId || assets.length === 0}
                className="w-full justify-start gap-2"
              >
                <Plus size={16} />
                {selectedAssetIds.length > 0
                  ? `${selectedAssetIds.length} ${t("assetsSelected") || "أصل محدد"}`
                  : t("selectAssets")}
              </Button>
            </div>

            {selectedAssetIds.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-black text-muted-foreground mb-2">{t("selectedAssetsList")}</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedAssetIds.map(assetId => {
                    const asset = assets.find(a => a.id === assetId);
                    if (!asset) return null;
                    return (
                      <div key={assetId} className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5">
                        <div>
                          <p className="font-bold">{isRtl ? asset.name : (asset.nameEn || asset.name)}</p>
                          <p className="text-xs text-muted-foreground font-mono">{asset.code}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAsset(assetId)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* العمود الجانبي - الأيمن */}
      <div className="space-y-8">
        <FormSidebar>
          <div className="space-y-3 pb-4 border-b border-border">
            <Label className="text-sm font-black text-muted-foreground flex items-center gap-2">
              <FileText size={14} /> {t("notes")}
            </Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t("notesPlaceholder")}
              className="min-h-[120px] rounded-xl"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button onClick={() => router.back()} variant="outline" className="flex-1 h-11 rounded-full border-red-500 text-red-500 hover:bg-red-50 font-black">
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 h-11 rounded-full bg-primary hover:bg-primary/90 font-black gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
              {t("save")}
            </Button>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/30 text-xs font-bold text-muted-foreground flex gap-2">
            <Info size={14} className="text-primary shrink-0" />
            {isRtl
              ? "سيتم إنشاء أمر عمل واحد يتضمن جميع الأصول المستهدفة عند كل تنفيذ يدوي أو تلقائي."
              : "A single work order containing all target assets will be created on each execution (manual or automatic)."}
          </div>
        </FormSidebar>
      </div>

      {/* حوار اختيار الأصول المتعددة */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background border-border shadow-lg">
          <DialogHeader>
            <DialogTitle>{t("selectAssets")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {loadingAssets ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : assets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t("noAssets")}</p>
            ) : (
              <div className="space-y-2">
                {assets.map(asset => (
                  <div key={asset.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/20">
                    <input
                      type="checkbox"
                      id={`asset-${asset.id}`}
                      checked={tempSelectedAssetIds.includes(asset.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTempSelectedAssetIds(prev => [...prev, asset.id]);
                        } else {
                          setTempSelectedAssetIds(prev => prev.filter(id => id !== asset.id));
                        }
                      }}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <Label htmlFor={`asset-${asset.id}`} className="flex-1 cursor-pointer">
                      <div className="font-bold">{isRtl ? asset.name : (asset.nameEn || asset.name)}</div>
                      <div className="text-xs text-muted-foreground font-mono">{asset.code}</div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setAssetDialogOpen(false)}>{t("cancel")}</Button>
            <Button onClick={confirmAssetSelection} disabled={loadingAssets}>
              <Check className="h-4 w-4 mr-2" /> {t("confirm") || "تأكيد"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </FormPageContainer>
  );
}