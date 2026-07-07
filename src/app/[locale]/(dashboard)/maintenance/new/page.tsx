// src/app/[locale]/(dashboard)/maintenance/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  Info,
  Loader2,
  MapPin,
  Building,
  Layers,
  DoorOpen,
  AlertCircle,
  FileText,
  Calendar,
  Save,
  X,
  Check,
  Plus,
  Sparkles,
  Shield,
  Clock,
  Tag,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

import { BranchSelector } from "@/components/shared/BranchSelector";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
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

interface AssetType {
  id: string;
  name: string;
  nameEn?: string;
}
interface Asset {
  id: string;
  name: string;
  code: string;
  nameEn?: string;
}

type LocationLevel = "building" | "floor" | "room";

// دالة مساعدة لتحويل التردد النصي إلى أيام
function frequencyStringToDays(freq: string): number {
  switch (freq) {
    case "MONTHLY":
      return 30;
    case "QUARTERLY":
      return 90;
    case "SEMI_ANNUAL":
      return 180;
    case "YEARLY":
      return 365;
    default:
      return 30;
  }
}

// دالة للحصول على اسم التردد المترجم
function getFrequencyLabel(freq: string, isRtl: boolean): string {
  const map: Record<string, { ar: string; en: string }> = {
    MONTHLY: { ar: "شهري", en: "Monthly" },
    QUARTERLY: { ar: "ربع سنوي", en: "Quarterly" },
    SEMI_ANNUAL: { ar: "نصف سنوي", en: "Semi-annual" },
    YEARLY: { ar: "سنوي", en: "Yearly" },
  };
  return isRtl ? map[freq]?.ar || freq : map[freq]?.en || freq;
}

export default function NewMaintenanceSchedulePage() {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("MaintenanceForm");
  const { data: session } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // بيانات أنواع الأصول والأصول
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(false); // ✅ حالة تحميل الأنواع
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // حالة الموقع الهرمي
  const [branchId, setBranchId] = useState<string>("");
  const [buildingId, setBuildingId] = useState<string>("");
  const [floorId, setFloorId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  // مستوى التحديد (مبنى / دور / غرفة)
  const [locationLevel, setLocationLevel] = useState<LocationLevel>("building");

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
    frequencyDays: 30,
    leadDays: 30,
    startDate: "",
    assetTypeId: "",
    notes: "",
    isActive: true,
  });

  // كرت الخلفية الزجاجي
  const glassCard =
    "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

  // جلب البيانات الأولية (المباني وأنواع الأصول الأساسية)
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

  // ✅ جلب أنواع الأصول حسب الدور (عند اختيار دور)
  useEffect(() => {
    // إذا لم يتم اختيار دور، نترك القائمة كما هي (جميع الأنواع)
    if (!floorId) {
      // يمكن إعادة جلب الكل إذا أردنا، لكننا نحتفظ بالبيانات الأولية
      // ويمكن إعادة تعيينها إلى الكل إذا كانت قد تمت فلترتها من قبل
      // لكننا سنقوم بجلب الكل فقط عند الحاجة، وسنكتفي بالبيانات الأولية
      return;
    }

    const controller = new AbortController();
    const fetchFilteredTypes = async () => {
      setLoadingAssetTypes(true);
      try {
        const res = await fetch(`/api/asset-types?floorId=${floorId}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setAssetTypes(data);
        } else {
          // في حالة الخطأ، نترك القائمة كما هي (قديمة)
          console.error("فشل جلب الأنواع حسب الدور");
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error(err);
        }
      } finally {
        setLoadingAssetTypes(false);
      }
    };

    fetchFilteredTypes();

    return () => controller.abort();
  }, [floorId]); // ✅ يعيد الجلب عند تغيير الدور

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
          setFloors(Array.isArray(data) ? data : []);
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
          const currentBuilding = buildings.find((b) => b.id === buildingId);
          const currentFloor = floors.find((f) => f.id === floorId);
          const buildingCode = currentBuilding?.code || "";
          const floorCode = currentFloor?.code || "";
          const roomsWithCode = (Array.isArray(data) ? data : []).map(
            (room: any) => ({
              id: room.id,
              name: room.name,
              nameEn: room.nameEn,
              code: room.code,
              floorId,
              buildingId,
              fullCode: `${buildingCode}-${floorCode}-${room.code || ""}`,
            })
          );
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

    if (locationLevel === "room" && roomId) {
      params.append("roomId", roomId);
      canFetch = true;
    } else if (locationLevel === "floor" && floorId) {
      params.append("floorId", floorId);
      canFetch = true;
    } else if (locationLevel === "building" && buildingId) {
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
    setSelectedAssetIds((prev) => prev.filter((id) => id !== assetId));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    let locationValid = false;
    if (locationLevel === "room" && roomId) locationValid = true;
    else if (locationLevel === "floor" && floorId) locationValid = true;
    else if (locationLevel === "building" && buildingId) locationValid = true;

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

    let finalFrequencyDays = formData.frequencyDays;
    if (!finalFrequencyDays || finalFrequencyDays <= 0) {
      finalFrequencyDays = frequencyStringToDays(formData.frequency);
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        frequency: formData.frequency,
        frequencyDays: finalFrequencyDays,
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
      else if (locationLevel === "building" && buildingId)
        payload.buildingId = buildingId;

      const res = await fetch("/api/maintenance/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(t("createSuccess"));
        router.push(`/${locale}/maintenance`);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || t("createError"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!dataLoaded || loadingBuildings) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

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

  const isLocationSelected = () => {
    if (locationLevel === "room") return !!roomId;
    if (locationLevel === "floor") return !!floorId;
    if (locationLevel === "building") return !!buildingId;
    return false;
  };

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Calendar className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t("newTitle")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("newSubtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الرئيسي */}
        <div className="lg:col-span-2 space-y-8">
          {/* معلومات أساسية */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
                <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("basicInfo")}
              </h2>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t("name")} <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("namePlaceholder")}
                  className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("frequency")}
                  </Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(v) => {
                      const newDays = frequencyStringToDays(v);
                      setFormData({
                        ...formData,
                        frequency: v,
                        frequencyDays: newDays,
                      });
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
                      <SelectValue placeholder={t("selectFrequency")}>
                        {getFrequencyLabel(formData.frequency, isRtl)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">{t("monthly")}</SelectItem>
                      <SelectItem value="QUARTERLY">{t("quarterly")}</SelectItem>
                      <SelectItem value="SEMI_ANNUAL">
                        {t("semiAnnual")}
                      </SelectItem>
                      <SelectItem value="YEARLY">{t("yearly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("leadDays")}
                  </Label>
                  <Input
                    type="number"
                    value={formData.leadDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        leadDays: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("frequencyDays")}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.frequencyDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        frequencyDays: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                    placeholder={isRtl ? "مثال: 30" : "e.g. 30"}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("startDate")}
                  </Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {t("startDateHint")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-700/30">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 dark:border-slate-600"
                />
                <Label
                  htmlFor="isActive"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {t("active")}
                </Label>
              </div>
            </div>
          </div>

          {/* الموقع */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "تفاصيل الموقع" : "Location Details"}
                <span className="text-rose-500 text-sm ml-1">*</span>
              </h2>
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap gap-4 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-700/30">
                {["building", "floor", "room"].map((level) => (
                  <label
                    key={level}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      value={level}
                      checked={locationLevel === level}
                      onChange={() => setLocationLevel(level as LocationLevel)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {level === "building"
                        ? isRtl
                          ? "مبنى"
                          : "Building"
                        : ""}
                      {level === "floor"
                        ? isRtl
                          ? "دور"
                          : "Floor"
                        : ""}
                      {level === "room"
                        ? isRtl
                          ? "غرفة"
                          : "Room"
                        : ""}
                    </span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-indigo-400" />
                    {isRtl ? "الفرع" : "Branch"}
                  </Label>
                  <BranchSelector
                    value={branchId}
                    onValueChange={(val) => {
                      setBranchId(val);
                      setBuildingId("");
                      setFloorId("");
                      setRoomId("");
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-indigo-400" />
                    {isRtl ? "المبنى أو المنطقة" : "Building / Zone"}
                  </Label>
                  <div className="relative">
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
                    {!branchId && (
                      <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl cursor-not-allowed z-10" />
                    )}
                  </div>
                </div>

                {(locationLevel === "floor" || locationLevel === "room") && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-indigo-400" />
                      {isRtl ? "الدور أو المنطقة" : "Floor / Zone"}
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
                      <DoorOpen className="h-4 w-4 text-indigo-400" />
                      {isRtl ? "الوحدة" : "Unit"}
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

          {/* الأصول */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "بيانات الأصل (اختياري)" : "Asset Details (Optional)"}
              </h2>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t("assetType")}
                </Label>
                <AssetTypeField
                  value={formData.assetTypeId}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      assetTypeId: val ?? "",
                    }))
                  }
                  assetTypes={assetTypes}
                  disabled={!isLocationSelected() || loadingAssetTypes}
                  placeholder={
                    loadingAssetTypes
                      ? isRtl
                        ? "جاري التحميل..."
                        : "Loading..."
                      : isLocationSelected()
                      ? isRtl
                        ? "اختر نوع الأصل"
                        : "Select asset type"
                      : isRtl
                      ? "اختر الموقع أولاً"
                      : "Select location first"
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t("selectAssets")}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={openAssetDialog}
                  disabled={
                    !isLocationSelected() ||
                    !formData.assetTypeId ||
                    assets.length === 0
                  }
                  className="w-full justify-start gap-2 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12"
                >
                  <Plus className="h-4 w-4" />
                  {selectedAssetIds.length > 0
                    ? `${selectedAssetIds.length} ${
                        t("assetsSelected") || "أصل محدد"
                      }`
                    : t("selectAssets")}
                </Button>
              </div>

              {selectedAssetIds.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t("selectedAssetsList")}
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedAssetIds.map((assetId) => {
                      const asset = assets.find((a) => a.id === assetId);
                      if (!asset) return null;
                      return (
                        <div
                          key={assetId}
                          className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30"
                        >
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {isRtl ? asset.name : asset.nameEn || asset.name}
                            </p>
                            <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
                              {asset.code}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAsset(assetId)}
                            className="p-1.5 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <X className="h-4 w-4" />
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

        {/* العمود الجانبي */}
        <div className="space-y-6">
          {/* الملاحظات */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("notes")}
              </h3>
            </div>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder={t("notesPlaceholder")}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[120px]"
            />
          </div>

          {/* إرشادات */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/40 dark:to-purple-950/40">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "إرشادات" : "Guidelines"}
              </h3>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  {isRtl
                    ? "اختر مستوى الموقع (مبنى/دور/غرفة) لتحديد الأصول المتاحة."
                    : "Choose location level to filter available assets."}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  {isRtl
                    ? "يمكنك اختيار عدة أصول للجدول الواحد."
                    : "You can select multiple assets per schedule."}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  {isRtl
                    ? "سيتم إنشاء أمر عمل واحد يشمل جميع الأصول المختارة."
                    : "A single work order will be created for all selected assets."}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  {isRtl
                    ? "يمكنك تحديد أيام التحضير المسبق لتنبيه الفريق قبل الموعد."
                    : "Set lead days to alert the team before the due date."}
                </span>
              </li>
            </ul>
          </div>

          {/* الأزرار */}
          <div className="flex gap-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12 font-medium"
            >
              <X className="h-4 w-4 ml-2" />
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5 ml-2" />
              )}
              {t("save")}
            </Button>
          </div>

          {/* مساعدة سريعة */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
            <Info className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              {isRtl
                ? "سيتم إنشاء أمر عمل واحد يتضمن جميع الأصول المستهدفة عند كل تنفيذ يدوي أو تلقائي."
                : "A single work order containing all target assets will be created on each execution."}
            </div>
          </div>
        </div>
      </div>

      {/* حوار اختيار الأصول */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100 text-xl font-bold">
              {t("selectAssets")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {loadingAssets ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                {t("noAssets")}
              </div>
            ) : (
              <div className="space-y-2">
                {assets.map((asset) => (
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
                          setTempSelectedAssetIds((prev) => [
                            ...prev,
                            asset.id,
                          ]);
                        } else {
                          setTempSelectedAssetIds((prev) =>
                            prev.filter((id) => id !== asset.id)
                          );
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 dark:border-slate-600"
                    />
                    <Label
                      htmlFor={`asset-${asset.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium text-slate-800 dark:text-slate-100">
                        {isRtl ? asset.name : asset.nameEn || asset.name}
                      </div>
                      <div className="text-xs font-mono text-slate-400 dark:text-slate-500">
                        {asset.code}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <Button
              variant="outline"
              onClick={() => setAssetDialogOpen(false)}
              className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={confirmAssetSelection}
              disabled={loadingAssets}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20"
            >
              <Check className="h-4 w-4 mr-2" />
              {t("confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}