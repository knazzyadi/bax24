// src/app/[locale]/(dashboard)/work-orders/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FileText,
  MapPin,
  Info,
  Save,
  X,
  Loader2,
  Plus,
  Check,
  Wrench,
  Building,
  Layers,
  DoorOpen,
  Sparkles,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BranchSelector } from "@/components/shared/BranchSelector";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
import { AssetTypeField } from "@/components/shared/form/AssetTypeField";

// ========== أنواع البيانات ==========
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

type LocationLevel = "building" | "floor" | "room";

// ========== المكون الرئيسي ==========
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

  // القوائم المنسدلة
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);

  // الأصول المتاحة للاختيار (في الحوار)
  const [assetsList, setAssetsList] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // الأصول المحددة (المعرفات فقط)
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // تفاصيل الأصول المحددة (للعرض)
  const [selectedAssetsDetails, setSelectedAssetsDetails] = useState<Asset[]>([]);
  const [loadingSelectedAssets, setLoadingSelectedAssets] = useState(false);

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

  // كرت الخلفية الزجاجي
  const glassCard =
    "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

  // ====== 1. جلب البيانات الأولية ======
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prioritiesRes, statusesRes, assetTypesRes, buildingsRes, workOrderRes] =
          await Promise.all([
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

        // ✅ التأكد من أن البيانات مصفوفات
        setPriorities(Array.isArray(prioritiesData) ? prioritiesData : []);
        setStatuses(Array.isArray(statusesData) ? statusesData : []);
        setAssetTypes(Array.isArray(typesData) ? typesData : []);
        setBuildings(Array.isArray(buildingsData) ? buildingsData : []);

        // استخراج معرفات الأصول
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

        // ==============================
        // ✅ تعيين الموقع - منطق الكود الأصلي (يعمل)
        // ==============================
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

  // ====== 2. جلب تفاصيل الأصول المحددة (مع Promise.allSettled) ======
  useEffect(() => {
    if (selectedAssetIds.length === 0) {
      setSelectedAssetsDetails([]);
      return;
    }

    const fetchSelectedAssets = async () => {
      setLoadingSelectedAssets(true);
      try {
        const results = await Promise.allSettled(
          selectedAssetIds.map(async (assetId) => {
            const res = await fetch(`/api/assets/${assetId}`);
            if (!res.ok) {
              throw new Error(`Failed to fetch asset ${assetId}`);
            }
            return res.json();
          })
        );

        const successfulAssets = results
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
          .map((result) => result.value);

        const failedIds = results
          .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
          .map((result) => {
            const match = result.reason?.message?.match(/asset (\S+)/);
            return match ? match[1] : 'unknown';
          });

        if (failedIds.length > 0) {
          console.warn('⚠️ Failed to fetch assets:', failedIds);
        }

        setSelectedAssetsDetails(successfulAssets);
      } catch (error) {
        console.error("Error fetching selected assets:", error);
        toast.error(t("fetchAssetsError") || "فشل تحميل بعض الأصول");
      } finally {
        setLoadingSelectedAssets(false);
      }
    };

    fetchSelectedAssets();
  }, [selectedAssetIds, t]);

  // ====== 3. جلب الأدوار بناءً على buildingId ======
  useEffect(() => {
    if (!buildingId) {
      setFloors([]);
      return;
    }
    const fetchFloors = async () => {
      setLoadingFloors(true);
      try {
        const res = await fetch(`/api/buildings/${buildingId}/floors`);
        if (!res.ok) {
          console.error(`Failed to fetch floors for building ${buildingId}`);
          setFloors([]);
          return;
        }
        const data = await res.json();
        // ✅ التأكد من أن البيانات مصفوفة
        setFloors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching floors:", error);
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    };
    fetchFloors();
  }, [buildingId]);

  // ====== 4. جلب الغرف بناءً على floorId ======
  useEffect(() => {
    if (!floorId) {
      setRooms([]);
      return;
    }
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await fetch(`/api/floors/${floorId}/rooms`);
        if (!res.ok) {
          console.error(`Failed to fetch rooms for floor ${floorId}`);
          setRooms([]);
          return;
        }
        const data = await res.json();
        const currentBuilding = buildings.find((b) => b.id === buildingId);
        const currentFloor = floors.find((f) => f.id === floorId);
        const buildingCode = currentBuilding?.code || "";
        const floorCode = currentFloor?.code || "";
        const roomsWithCode = (Array.isArray(data) ? data : []).map((room: any) => ({
          id: room.id,
          name: room.name,
          nameEn: room.nameEn,
          floorId,
          buildingId,
          fullCode: `${buildingCode}-${floorCode}-${room.code || ""}`,
        }));
        setRooms(roomsWithCode);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [floorId, buildingId, buildings, floors]);

  // ====== 5. جلب الأصول المتاحة (للحوار) ======
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
        if (!res.ok) {
          console.error("Failed to fetch assets for room:", roomId);
          setAssetsList([]);
          return;
        }
        const data = await res.json();
        setAssetsList(data.assets || data || []);
      } catch (error) {
        console.error("Error fetching assets:", error);
        setAssetsList([]);
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchAssets();
  }, [roomId, formData.assetTypeId, locationLevel]);

  // ====== دوال التحكم ======
  const handleLocationLevelChange = (level: LocationLevel) => {
    setLocationLevel(level);
    setSelectedAssetIds([]);
    setSelectedAssetsDetails([]);
    if (level !== "room") {
      setRoomId("");
      setFormData((prev) => ({ ...prev, assetTypeId: "" }));
    }
    if (level !== "floor") setFloorId("");
    if (level !== "building") setBuildingId("");
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
    setSelectedAssetIds((prev) => prev.filter((id) => id !== assetId));
    setSelectedAssetsDetails((prev) => prev.filter((asset) => asset.id !== assetId));
  };

  // ====== الإرسال ======
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
      else if (locationLevel === "building" && buildingId)
        payload.buildingId = buildingId;

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

  // ====== دوال عرض النصوص ======
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "MAINTENANCE": return t("type_maintenance");
      case "CORRECTIVE": return t("type_corrective");
      case "EMERGENCY": return t("type_emergency");
      default: return type;
    }
  };
  const getPriorityLabel = (id: string) => {
    const p = priorities.find((p) => p.id === id);
    if (!p) return "";
    return isRtl ? p.name : p.nameEn || p.name;
  };
  const getStatusLabel = (id: string) => {
    const s = statuses.find((s) => s.id === id);
    if (!s) return "";
    return isRtl ? s.name : s.nameEn || s.name;
  };
  const getAssetTypeLabel = (id: string) => {
    const at = assetTypes.find((at) => at.id === id);
    if (!at) return "";
    return isRtl ? at.name : at.nameEn || at.name;
  };
  const getSelectedLocationSummary = () => {
    if (locationLevel === "room" && roomId) {
      const room = rooms.find((r) => r.id === roomId);
      return room ? `${room.name} (${room.fullCode})` : t("room");
    }
    if (locationLevel === "floor" && floorId) {
      const floor = floors.find((f) => f.id === floorId);
      return floor ? floor.name : t("floor");
    }
    if (locationLevel === "building" && buildingId) {
      const building = buildings.find((b) => b.id === buildingId);
      return building ? building.name : t("building");
    }
    return t("notSelected");
  };

  if (loading) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="relative space-y-8 p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Wrench className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t("editTitle")}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("editSubtitle")}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 ml-2" /> {isRtl ? "العودة" : "Back"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الرئيسي */}
          <div className="lg:col-span-2 space-y-8">
            {/* معلومات أساسية */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("basicInfo")}</h2>
              </div>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("title")} <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("description")}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[120px]"
                  />
                </div>
              </div>
            </div>

            {/* الموقع */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("location")}</h2>
              </div>
              <div className="space-y-5">
                <div className="flex flex-wrap gap-4 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-700/30">
                  {["building", "floor", "room"].map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="locationLevel"
                        checked={locationLevel === level}
                        onChange={() => handleLocationLevelChange(level as LocationLevel)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {level === "building" ? (isRtl ? "مبنى" : "Building") : ""}
                        {level === "floor" ? (isRtl ? "دور" : "Floor") : ""}
                        {level === "room" ? (isRtl ? "غرفة" : "Room") : ""}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-indigo-400" /> {t("branch")}
                    </Label>
                    <BranchSelector value={branchId} onValueChange={setBranchId} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-indigo-400" /> {t("building")}
                    </Label>
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
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-indigo-400" /> {t("floor")}
                      </Label>
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
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <DoorOpen className="h-4 w-4 text-indigo-400" /> {t("room")}
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

                {((locationLevel === "building" && buildingId) ||
                  (locationLevel === "floor" && floorId) ||
                  (locationLevel === "room" && roomId)) && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {isRtl ? "الموقع المختار:" : "Selected Location:"}
                    </span>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {getSelectedLocationSummary()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* الأصول (تظهر فقط عند اختيار غرفة) */}
            {locationLevel === "room" && (
              <div className={glassCard}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40">
                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("assets")}</h2>
                </div>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("assetType")}</Label>
                    <AssetTypeField
                      value={formData.assetTypeId}
                      onChange={(val) => setFormData((prev) => ({ ...prev, assetTypeId: val ?? "" }))}
                      assetTypes={assetTypes}
                      disabled={!roomId}
                      placeholder={roomId ? t("selectAssetType") : t("selectLocationFirst")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("selectAssets")}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openAssetDialog}
                      disabled={!roomId || assetsList.length === 0}
                      className="w-full justify-start gap-2 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12"
                    >
                      <Plus className="h-4 w-4" />
                      {selectedAssetIds.length > 0
                        ? `${selectedAssetIds.length} ${t("assetsSelected") || "أصل محدد"}`
                        : t("selectAssets")}
                    </Button>
                  </div>

                  {selectedAssetsDetails.length > 0 && (
                    <div className="space-y-2">
                      {selectedAssetsDetails.map((asset) => (
                        <div
                          key={asset.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30"
                        >
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {isRtl ? asset.name : asset.nameEn || asset.name}
                            </p>
                            <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{asset.code}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAsset(asset.id)}
                            className="p-1.5 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {loadingSelectedAssets && (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                      <span className="mr-2 text-sm text-slate-500 dark:text-slate-400">
                        {isRtl ? "جاري تحميل الأصول..." : "Loading assets..."}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* العمود الجانبي */}
          <div className="space-y-6">
            {/* معلومات إضافية */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                  <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("additionalInfo")}</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("type")}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
                      <SelectValue placeholder={t("selectType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAINTENANCE">{t("type_maintenance")}</SelectItem>
                      <SelectItem value="CORRECTIVE">{t("type_corrective")}</SelectItem>
                      <SelectItem value="EMERGENCY">{t("type_emergency")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("priority")}</Label>
                  <Select
                    value={formData.priorityId}
                    onValueChange={(v) => setFormData({ ...formData, priorityId: v })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
                      <SelectValue placeholder={t("selectPriority")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t("none")}</SelectItem>
                      {priorities.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {isRtl ? p.name : p.nameEn || p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("status")}</Label>
                  <Select
                    value={formData.statusId}
                    onValueChange={(v) => setFormData({ ...formData, statusId: v })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
                      <SelectValue placeholder={t("selectStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t("none")}</SelectItem>
                      {statuses.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {isRtl ? s.name : s.nameEn || s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("notes")}</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t("notesPlaceholder")}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[100px]"
                  />
                </div>
              </div>
            </div>

            {/* مساعدة سريعة */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
              <Shield className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                {isRtl ? "يمكنك اختيار عدة أصول لأمر العمل الواحد." : "You can select multiple assets for this work order."}
              </div>
            </div>

            {/* الأزرار */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => router.back()}
                variant="outline"
                className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12 font-medium"
              >
                <X className="h-4 w-4 ml-2" /> {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 ml-2" />}
                {t("save")}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* حوار اختيار الأصول */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100 text-xl font-bold">{t("selectAssets")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {loadingAssets ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : assetsList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">{t("noAssets")}</div>
            ) : (
              <div className="space-y-2">
                {assetsList.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={`asset-${asset.id}`}
                      checked={tempSelectedAssetIds.includes(asset.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTempSelectedAssetIds((prev) => [...prev, asset.id]);
                        } else {
                          setTempSelectedAssetIds((prev) => prev.filter((id) => id !== asset.id));
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 dark:border-slate-600"
                    />
                    <Label htmlFor={`asset-${asset.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium text-slate-800 dark:text-slate-100">
                        {isRtl ? asset.name : asset.nameEn || asset.name}
                      </div>
                      <div className="text-xs font-mono text-slate-400 dark:text-slate-500">{asset.code}</div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <Button variant="outline" onClick={() => setAssetDialogOpen(false)} className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400">
              {t("cancel")}
            </Button>
            <Button onClick={confirmAssetSelection} disabled={loadingAssets} className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20">
              <Check className="h-4 w-4 mr-2" /> {t("confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}