// src/app/[locale]/(dashboard)/work-orders/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  Info, Loader2, MapPin, Building, Layers, DoorOpen, AlertCircle, FileText, Wrench, Save, X, Check, Plus
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

interface AssetType { id: string; name: string; code?: string; nameEn?: string; }
interface Asset { id: string; name: string; code: string; nameEn?: string; }
interface Priority { id: string; name: string; nameEn?: string; color?: string; }
interface Status { id: string; name: string; nameEn?: string; color?: string; }

type LocationLevel = 'building' | 'floor' | 'room';

export default function NewWorkOrderPage() {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations('WorkOrdersForm');
  const { data: session } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // بيانات القوائم المنسدلة
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
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
  const [locationLevel, setLocationLevel] = useState<LocationLevel>('room');

  // بيانات المباني والأدوار والغرف
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // حالة عامة لفتح وإغلاق حوار اختيار الأصول
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [tempSelectedAssetIds, setTempSelectedAssetIds] = useState<string[]>([]);

  // البيانات الأساسية لأمر العمل
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "MAINTENANCE",
    priorityId: "",
    statusId: "",
    assetTypeId: "",
    notes: "",
  });

  const containerClass = "bg-card border border-border rounded-md p-6 shadow-sm hover:shadow-md transition-all";

  // دوال مساعدة لعرض النص المترجم في القوائم المنسدلة
  const getTypeLabel = (typeValue: string) => {
    switch (typeValue) {
      case "MAINTENANCE": return t("type_maintenance");
      case "CORRECTIVE": return t("type_corrective");
      case "EMERGENCY": return t("type_emergency");
      case "BULK_PREVENTIVE": return t("type_bulk");
      default: return typeValue;
    }
  };

  const getPriorityLabel = (id: string) => {
    const priority = priorities.find(p => p.id === id);
    if (!priority) return "";
    return isRtl ? priority.name : (priority.nameEn || priority.name);
  };

  const getStatusLabel = (id: string) => {
    const status = statuses.find(s => s.id === id);
    if (!status) return "";
    return isRtl ? status.name : (status.nameEn || status.name);
  };

  // جلب البيانات الأولية
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [prioritiesRes, statusesRes, assetTypesRes, buildingsRes] = await Promise.all([
          fetch("/api/work-order-priorities"),
          fetch("/api/work-order-statuses"),
          fetch("/api/asset-types"),
          fetch("/api/buildings"),
        ]);
        if (prioritiesRes.ok) setPriorities(await prioritiesRes.json());
        if (statusesRes.ok) setStatuses(await statusesRes.json());
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

  // فتح حوار اختيار الأصول مع تهيئة القائمة المؤقتة
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
    if (!formData.title.trim()) {
      toast.error(t("titleRequired") || "العنوان مطلوب");
      return;
    }
    let locationValid = false;
    if (locationLevel === 'room' && roomId) locationValid = true;
    else if (locationLevel === 'floor' && floorId) locationValid = true;
    else if (locationLevel === 'building' && buildingId) locationValid = true;
    
    if (!locationValid) {
      toast.error(t("locationRequired") || "الموقع (مبنى/دور/غرفة) مطلوب");
      return;
    }
    if (!branchId) {
      toast.error(t("branchRequired") || "الفرع مطلوب");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priorityId: formData.priorityId || null,
        statusId: formData.statusId || null,
        branchId,
        assetTypeId: formData.assetTypeId || null,
        assetIds: selectedAssetIds,
        notes: formData.notes,
      };
      if (locationLevel === 'room' && roomId) payload.roomId = roomId;
      else if (locationLevel === 'floor' && floorId) payload.floorId = floorId;
      else if (locationLevel === 'building' && buildingId) payload.buildingId = buildingId;

      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(t("createSuccess"));
        router.push(`/${locale}/work-orders`);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || t("createError"));
      }
    } catch {
      toast.error(t("networkError") || "حدث خطأ في الشبكة");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!dataLoaded || loadingBuildings) {
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
      icon={<Wrench size={28} />}
      title={t("newTitle")}
      subtitle={t("newSubtitle")}
    >
      {/* العمود الرئيسي - الأيسر */}
      <div className="lg:col-span-2 space-y-8">
        {/* 1. معلومات أساسية (بدون ملاحظات) */}
        <FormSection icon={<AlertCircle size={16} />} title={t("basicInfo")}>
          <div className="grid md:grid-cols-2 gap-6">
            <FormField label={t("title")} required>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t("titlePlaceholder")}
                className="h-12 rounded-xl"
              />
            </FormField>
            <FormField label={t("type")}>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger className="h-12 rounded-xl">
                  {formData.type ? getTypeLabel(formData.type) : <SelectValue placeholder={t("selectType")} />}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAINTENANCE">{t("type_maintenance")}</SelectItem>
                  <SelectItem value="CORRECTIVE">{t("type_corrective")}</SelectItem>
                  <SelectItem value="EMERGENCY">{t("type_emergency")}</SelectItem>
                  <SelectItem value="BULK_PREVENTIVE">{t("type_bulk")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <FormField label={t("priority")}>
              <Select value={formData.priorityId} onValueChange={(v) => setFormData({ ...formData, priorityId: v })}>
                <SelectTrigger className="h-12 rounded-xl">
                  {formData.priorityId ? getPriorityLabel(formData.priorityId) : <SelectValue placeholder={t("selectPriority")} />}
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(p => (
                    <SelectItem key={p.id} value={p.id}>{isRtl ? p.name : (p.nameEn || p.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t("status")}>
              <Select value={formData.statusId} onValueChange={(v) => setFormData({ ...formData, statusId: v })}>
                <SelectTrigger className="h-12 rounded-xl">
                  {formData.statusId ? getStatusLabel(formData.statusId) : <SelectValue placeholder={t("selectStatus")} />}
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(s => (
                    <SelectItem key={s.id} value={s.id}>{isRtl ? s.name : (s.nameEn || s.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <FormField label={t("description")}>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("descriptionPlaceholder")}
              className="min-h-[100px] rounded-xl"
            />
          </FormField>
        </FormSection>

        {/* 2. حاوية الموقع مع اختيار مستوى الموقع */}
        <div className={containerClass}>
          <div className="space-y-3">
            <h3 className="text-foreground font-black text-lg uppercase tracking-widest flex items-center gap-2">
              <MapPin size={16} /> {isRtl ? 'تفاصيل الموقع' : 'Location Details'}
              <span className="text-red-500 text-sm">*</span>
            </h3>
            {/* اختيار مستوى الموقع */}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* 3. حاوية الأصل - مع دعم عدة أصول */}
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

            {/* زر اختيار الأصول المتعددة */}
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

            {/* عرض الأصول المختارة كبطاقات */}
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

      {/* العمود الجانبي - الأيمن (مع الملاحظات في الأعلى) */}
      <div className="space-y-8">
        <FormSidebar>
          {/* الملاحظات في أعلى العمود الأيمن */}
          <div className="space-y-3 pb-4 border-b border-border">
            <Label className="text-sm font-black text-muted-foreground flex items-center gap-2">
              <FileText size={14} /> {t("notes")}
            </Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t("notes")}
              className="min-h-[120px] rounded-xl"
            />
          </div>

          {/* الأزرار أسفل الملاحظات */}
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
              ? "يمكنك اختيار عدة أصول لأمر العمل الواحد، ويمكنك تحديد مستوى الموقع (مبنى/دور/غرفة) لجلب الأصول حسب الحاجة."
              : "You can select multiple assets for a single work order, and choose the location level (building/floor/room) to fetch assets accordingly."}
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