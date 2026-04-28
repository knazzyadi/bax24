// src/app/[locale]/(dashboard)/work-orders/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, MapPin, Info, Save, X, Loader2, Plus, Check, Wrench, Building, Layers, DoorOpen } from "lucide-react";
import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { SidebarCard } from "@/components/shared/detail/SidebarCard";
import { BranchSelector } from "@/components/shared/BranchSelector";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
import { AssetTypeField } from "@/components/shared/form/AssetTypeField";

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

interface Priority {
  id: string;
  name: string;
  nameEn?: string;
}

interface Status {
  id: string;
  name: string;
  nameEn?: string;
}

interface Building {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;   // أضف code اختياري
}

interface Floor {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;   // أضف code اختياري
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

type LocationLevel = "building" | "floor" | "room";

export default function EditWorkOrderPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const id = params.id as string;
  const t = useTranslations("WorkOrdersForm");
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationLevel, setLocationLevel] = useState<LocationLevel>("building");

  // قوائم القيم
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assetsList, setAssetsList] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // بيانات الموقع
  const [branchId, setBranchId] = useState<string>("");
  const [buildingId, setBuildingId] = useState<string>("");
  const [floorId, setFloorId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // حوار الأصول
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [tempSelectedAssetIds, setTempSelectedAssetIds] = useState<string[]>([]);

  // بيانات النموذج
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "MAINTENANCE",
    priorityId: "",
    statusId: "",
    assetTypeId: "",
    notes: "",
  });

  // جلب البيانات الأولية (أولويات، حالات، أنواع أصول، مباني، وأمر العمل)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prioritiesRes, statusesRes, assetTypesRes, buildingsRes, workOrderRes] = await Promise.all([
          fetch("/api/work-order-priorities"),
          fetch("/api/work-order-statuses"),
          fetch("/api/asset-types"),
          fetch("/api/buildings"),
          fetch(`/api/work-orders/${id}`),
        ]);

        if (!workOrderRes.ok) {
          const errData = await workOrderRes.json();
          throw new Error(errData.error || "فشل تحميل أمر العمل");
        }

        const prioritiesData = await prioritiesRes.json();
        const statusesData = await statusesRes.json();
        const typesData = await assetTypesRes.json();
        const buildingsData = await buildingsRes.json();
        const workOrderData = await workOrderRes.json();

        setPriorities(prioritiesData);
        setStatuses(statusesData);
        setAssetTypes(Array.isArray(typesData) ? typesData : []);
        setBuildings(buildingsData);

        // الأصول المرتبطة (من workOrderAssets أو legacy assetId)
        let assetIds: string[] = [];
        if (workOrderData.workOrderAssets && workOrderData.workOrderAssets.length) {
          assetIds = workOrderData.workOrderAssets.map((wa: any) => wa.assetId);
        } else if (workOrderData.assetId) {
          assetIds = [workOrderData.assetId];
        }
        setSelectedAssetIds(assetIds);

        setFormData({
          title: workOrderData.title || "",
          description: workOrderData.description || "",
          type: workOrderData.type || "MAINTENANCE",
          priorityId: workOrderData.priorityId || "",
          statusId: workOrderData.statusId || "",
          assetTypeId: workOrderData.assetTypeId || "",
          notes: workOrderData.notes || "",
        });

        // تعيين الموقع حسب البيانات المتوفرة
        if (workOrderData.room) {
          setRoomId(workOrderData.room.id);
          setLocationLevel("room");
          if (workOrderData.room.floor) {
            setFloorId(workOrderData.room.floor.id);
            if (workOrderData.room.floor.building) {
              setBuildingId(workOrderData.room.floor.building.id);
              setBranchId(workOrderData.room.floor.building.branchId);
            }
          }
        } else if (workOrderData.floorId) {
          setFloorId(workOrderData.floorId);
          setLocationLevel("floor");
          setBuildingId(workOrderData.buildingId || "");
        } else if (workOrderData.buildingId) {
          setBuildingId(workOrderData.buildingId);
          setLocationLevel("building");
        }
        if (workOrderData.branchId) setBranchId(workOrderData.branchId);
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || t("fetchError"));
        router.push(`/${locale}/work-orders`);
      } finally {
        setLoading(false);
        setLoadingBuildings(false);
      }
    };
    fetchData();
  }, [id, router, locale, t]);

  // جلب الأدوار عند تغيير المبنى
  useEffect(() => {
    if (!buildingId) {
      setFloors([]);
      return;
    }
    const fetchFloors = async () => {
      setLoadingFloors(true);
      try {
        const res = await fetch(`/api/buildings/${buildingId}/floors`);
        const data = await res.json();
        setFloors(data);
      } catch {
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    };
    fetchFloors();
  }, [buildingId]);

  // جلب الغرف عند تغيير الدور
  useEffect(() => {
    if (!floorId) {
      setRooms([]);
      return;
    }
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await fetch(`/api/floors/${floorId}/rooms`);
        const data = await res.json();
        const currentBuilding = buildings.find(b => b.id === buildingId);
        const currentFloor = floors.find(f => f.id === floorId);
        const buildingCode = currentBuilding?.code || "";
        const floorCode = currentFloor?.code || "";
        const roomsWithCode = data.map((room: any) => ({
          id: room.id,
          name: room.name,
          nameEn: room.nameEn,
          floorId,
          buildingId,
          fullCode: `${buildingCode}-${floorCode}-${room.code || ""}`,
        }));
        setRooms(roomsWithCode);
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [floorId, buildingId, buildings, floors]);

  // جلب الأصول المتاحة فقط عند اختيار مستوى غرفة
  useEffect(() => {
    if (locationLevel !== "room" || !roomId) {
      setAssetsList([]);
      return;
    }
    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        let url = `/api/assets?roomId=${roomId}`;
        if (formData.assetTypeId && formData.assetTypeId !== "all") {
          url += `&typeId=${formData.assetTypeId}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setAssetsList(data.assets || data);
      } catch {
        setAssetsList([]);
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchAssets();
  }, [roomId, formData.assetTypeId, locationLevel]);

  const handleLocationLevelChange = (level: LocationLevel) => {
    setLocationLevel(level);
    setSelectedAssetIds([]); // إعادة تعيين الأصول
    if (level !== "room") {
      setRoomId("");
      setFormData(prev => ({ ...prev, assetTypeId: "" }));
    }
    if (level !== "floor") setFloorId("");
    if (level !== "building") setBuildingId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }
    let locationValid = false;
    if (locationLevel === "building" && buildingId) locationValid = true;
    else if (locationLevel === "floor" && floorId) locationValid = true;
    else if (locationLevel === "room" && roomId) locationValid = true;
    if (!locationValid) {
      toast.error(t("locationRequired"));
      return;
    }
    if (!branchId) {
      toast.error(t("branchRequired"));
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        priorityId: formData.priorityId || null,
        statusId: formData.statusId || null,
        branchId,
        assetTypeId: formData.assetTypeId || null,
        assetIds: selectedAssetIds,
        notes: formData.notes || null,
      };
      if (locationLevel === "room" && roomId) payload.roomId = roomId;
      else if (locationLevel === "floor" && floorId) payload.floorId = floorId;
      else if (locationLevel === "building" && buildingId) payload.buildingId = buildingId;

      const res = await fetch(`/api/work-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(t("updateSuccess"));
        router.push(`/${locale}/work-orders/${id}`);
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || t("updateError"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setSaving(false);
    }
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "MAINTENANCE": return t("type_maintenance");
      case "CORRECTIVE": return t("type_corrective");
      case "EMERGENCY": return t("type_emergency");
      default: return type;
    }
  };
  const getPriorityLabel = (id: string) => {
    const p = priorities.find(p => p.id === id);
    if (!p) return "";
    return isRtl ? p.name : p.nameEn || p.name;
  };
  const getStatusLabel = (id: string) => {
    const s = statuses.find(s => s.id === id);
    if (!s) return "";
    return isRtl ? s.name : s.nameEn || s.name;
  };
  const getAssetTypeLabel = (id: string) => {
    const at = assetTypes.find(at => at.id === id);
    if (!at) return "";
    return isRtl ? at.name : at.nameEn || at.name;
  };
  const getSelectedLocationSummary = () => {
    if (locationLevel === "room" && roomId) {
      const room = rooms.find(r => r.id === roomId);
      return room ? `${room.name} (${room.fullCode})` : t("room");
    }
    if (locationLevel === "floor" && floorId) {
      const floor = floors.find(f => f.id === floorId);
      return floor ? floor.name : t("floor");
    }
    if (locationLevel === "building" && buildingId) {
      const building = buildings.find(b => b.id === buildingId);
      return building ? building.name : t("building");
    }
    return t("notSelected");
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
        icon={<Wrench size={28} />}
        title={t("editTitle")}
        subtitle={t("editSubtitle")}
        actions={null}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الرئيسي */}
          <div className="lg:col-span-2 space-y-8">
            <InfoCard title={t("basicInfo")} icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-black">{t("title")} *</Label>
                  <Input
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="h-14 rounded-2xl border-primary font-bold text-lg px-6"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-black">{t("description")}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="rounded-2xl border-primary p-6 min-h-[120px]"
                  />
                </div>
              </div>
            </InfoCard>

            {/* حاوية الموقع مع اختيار المستوى */}
            <InfoCard title={t("location")} icon={<MapPin className="h-5 w-5" />}>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="locationLevel"
                      checked={locationLevel === "building"}
                      onChange={() => handleLocationLevelChange("building")}
                    />
                    <span>{isRtl ? "مبنى" : "Building"}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="locationLevel"
                      checked={locationLevel === "floor"}
                      onChange={() => handleLocationLevelChange("floor")}
                    />
                    <span>{isRtl ? "دور" : "Floor"}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="locationLevel"
                      checked={locationLevel === "room"}
                      onChange={() => handleLocationLevelChange("room")}
                    />
                    <span>{isRtl ? "غرفة" : "Room"}</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-bold">{t("branch")}</Label>
                    <BranchSelector value={branchId} onValueChange={setBranchId} />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">{t("building")}</Label>
                    <BuildingSelector
                      value={buildingId}
                      onValueChange={(val) => {
                        setBuildingId(val);
                        setFloorId("");
                        setRoomId("");
                      }}
                      buildings={buildings}
                      loading={loadingBuildings}
                    />
                  </div>
                  {(locationLevel === "floor" || locationLevel === "room") && (
                    <div>
                      <Label className="text-xs font-bold">{t("floor")}</Label>
                      <FloorSelector
                        value={floorId}
                        onValueChange={(val) => {
                          setFloorId(val);
                          setRoomId("");
                        }}
                        floors={floors}
                        buildingId={buildingId}
                        loading={loadingFloors}
                      />
                    </div>
                  )}
                  {locationLevel === "room" && (
                    <div>
                      <Label className="text-xs font-bold">{t("room")}</Label>
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
                {((locationLevel === "building" && buildingId) ||
                  (locationLevel === "floor" && floorId) ||
                  (locationLevel === "room" && roomId)) && (
                  <div className="p-3 rounded-xl border border-primary/30 bg-primary/10 text-center">
                    <span className="font-bold">{isRtl ? "الموقع:" : "Location:"}</span>{" "}
                    {getSelectedLocationSummary()}
                  </div>
                )}
              </div>
            </InfoCard>

            {/* حاوية الأصول (تظهر فقط عند اختيار غرفة) */}
            {locationLevel === "room" && (
              <InfoCard title={t("assets")} icon={<FileText className="h-5 w-5" />}>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-black">{t("assetType")}</Label>
                    <AssetTypeField
                      value={formData.assetTypeId}
                      onChange={(val) => setFormData(prev => ({ ...prev, assetTypeId: val ?? "" }))}
                      assetTypes={assetTypes}
                      disabled={!roomId}
                      placeholder={roomId ? t("selectAssetType") : t("selectLocationFirst")}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-black">{t("selectAssets")}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openAssetDialog}
                      disabled={!roomId || assetsList.length === 0}
                      className="w-full justify-start gap-2"
                    >
                      <Plus size={16} />
                      {selectedAssetIds.length > 0
                        ? `${selectedAssetIds.length} ${t("assetsSelected") || t("assetsSelected")}`
                        : t("selectAssets")}
                    </Button>
                  </div>
                  {selectedAssetIds.length > 0 && (
                    <div className="space-y-2">
                      {selectedAssetIds.map(assetId => {
                        const asset = assetsList.find(a => a.id === assetId);
                        if (!asset) return null;
                        return (
                          <div key={assetId} className="flex justify-between items-center p-3 rounded-xl border border-primary/20 bg-primary/5">
                            <div>
                              <p className="font-bold">{isRtl ? asset.name : asset.nameEn || asset.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{asset.code}</p>
                            </div>
                            <button type="button" onClick={() => removeAsset(assetId)} className="text-red-500">
                              <X size={18} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </InfoCard>
            )}
          </div>

          {/* العمود الجانبي */}
          <div className="space-y-8">
            <SidebarCard title={t("additionalInfo")} icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-black">{t("type")}</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger className="w-full h-14 rounded-2xl border-primary font-black px-6">
                      {getTypeLabel(formData.type)}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAINTENANCE">{t("type_maintenance")}</SelectItem>
                      <SelectItem value="CORRECTIVE">{t("type_corrective")}</SelectItem>
                      <SelectItem value="EMERGENCY">{t("type_emergency")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-black">{t("priority")}</Label>
                  <Select value={formData.priorityId} onValueChange={(v) => setFormData({ ...formData, priorityId: v })}>
                    <SelectTrigger className="w-full h-14 rounded-2xl border-primary font-black px-6">
                      {formData.priorityId ? getPriorityLabel(formData.priorityId) : <span className="text-muted-foreground">{t("selectPriority")}</span>}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t("none")}</SelectItem>
                      {priorities.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {isRtl ? p.name : p.nameEn || p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-black">{t("status")}</Label>
                  <Select value={formData.statusId} onValueChange={(v) => setFormData({ ...formData, statusId: v })}>
                    <SelectTrigger className="w-full h-14 rounded-2xl border-primary font-black px-6">
                      {formData.statusId ? getStatusLabel(formData.statusId) : <span className="text-muted-foreground">{t("selectStatus")}</span>}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t("none")}</SelectItem>
                      {statuses.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {isRtl ? s.name : s.nameEn || s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-black">{t("notes")}</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t("notesPlaceholder")}
                    className="rounded-xl border-primary min-h-[100px]"
                  />
                </div>
              </div>
            </SidebarCard>

            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex gap-2 text-xs">
              <Info size={14} className="text-primary shrink-0 mt-0.5" />
              <span>{isRtl ? "يمكنك اختيار عدة أصول لأمر العمل الواحد." : "You can select multiple assets for this work order."}</span>
            </div>

            <div className="flex gap-3">
              <Button type="button" onClick={() => router.back()} variant="outline" className="flex-1 rounded-full border-red-500 text-red-500 h-12 font-black">
                <X size={18} className="ml-2" /> {t("cancel")}
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 rounded-full bg-primary text-white h-12 font-black gap-2">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save size={18} />}
                {t("save")}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* حوار اختيار الأصول المتعددة */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto bg-background border shadow-lg">
          <DialogHeader>
            <DialogTitle>{t("selectAssets")}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            {loadingAssets ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : assetsList.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t("noAssets")}</p>
            ) : (
              assetsList.map(asset => (
                <div key={asset.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={tempSelectedAssetIds.includes(asset.id)}
                    onChange={(e) => {
                      if (e.target.checked) setTempSelectedAssetIds(prev => [...prev, asset.id]);
                      else setTempSelectedAssetIds(prev => prev.filter(id => id !== asset.id));
                    }}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <Label className="flex-1 cursor-pointer">
                    <div className="font-bold">{isRtl ? asset.name : asset.nameEn || asset.name}</div>
                    <div className="text-xs text-muted-foreground">{asset.code}</div>
                  </Label>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setAssetDialogOpen(false)}>{t("cancel")}</Button>
            <Button onClick={confirmAssetSelection} disabled={loadingAssets}>
              <Check className="h-4 w-4 mr-2" /> {t("confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}