// src/app/[locale]/(dashboard)/tickets/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  Info,
  User,
  Send,
  Loader2,
  Plus,
  X,
  Upload,
  MapPin,
  Building,
  Layers,
  DoorOpen,
  AlertCircle,
  FileText,
  Sparkles,
  Shield,
  ImageIcon,
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { BranchSelector } from "@/components/shared/BranchSelector";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";

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
  code?: string;
}
interface Asset {
  id: string;
  name: string;
  code: string;
  nameEn?: string;
}

// =========================
// المكون الرئيسي
// =========================
export default function NewTicketPage() {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("Tickets");
  const { data: session } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // الموقع الهرمي
  const [buildingId, setBuildingId] = useState<string>("");
  const [floorId, setFloorId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");

  // المباني والأدوار والغرف
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

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

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // كرت الخلفية الزجاجي
  const glassCard =
    "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

  // تعبئة بيانات المبلّغ تلقائياً من الجلسة
  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        reporterName: session.user.name || "",
        reporterEmail: session.user.email || "",
      }));
    }
  }, [session]);

  // جلب المباني وأنواع الأصول (مع المسار الجديد)
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [buildingsRes, assetTypesRes] = await Promise.all([
          fetch("/api/locations/buildings"), // ✅ تم التحديث
          fetch("/api/asset-types"),
        ]);
        const buildingsData = await buildingsRes.json();
        const typesData = await assetTypesRes.json();
        setBuildings(Array.isArray(buildingsData) ? buildingsData : []);
        setAssetTypes(Array.isArray(typesData) ? typesData : []);
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

  // جلب الأدوار (مع المسار الجديد)
  useEffect(() => {
    if (!buildingId) {
      setFloors([]);
      return;
    }
    async function fetchFloors() {
      setLoadingFloors(true);
      try {
        const res = await fetch(`/api/locations/buildings/${buildingId}/floors`); // ✅ تم التحديث
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

  // جلب الغرف مع الكود الكامل (مع المسار الجديد)
  useEffect(() => {
    if (!floorId) {
      setRooms([]);
      return;
    }
    async function fetchRooms() {
      setLoadingRooms(true);
      try {
        const res = await fetch(`/api/locations/floors/${floorId}/rooms`); // ✅ تم التحديث
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

  // ✅ جلب الأصول بناءً على الغرفة ونوع الأصل (لا يتغير لأنه يستخدم /api/assets)
  useEffect(() => {
    if (!roomId) {
      setAssets([]);
      return;
    }

    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        const params = new URLSearchParams();
        params.append("roomId", roomId);
        if (formData.assetTypeId && formData.assetTypeId !== "all" && formData.assetTypeId !== "") {
          params.append("typeId", formData.assetTypeId);
        }

        const res = await fetch(`/api/assets?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const assetsData = data.data || data.assets || data || [];
          setAssets(Array.isArray(assetsData) ? assetsData : []);
        } else {
          setAssets([]);
        }
      } catch (error) {
        console.error("Error fetching assets:", error);
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();
  }, [roomId, formData.assetTypeId]);

  // عند تغيير الغرفة أو نوع الأصل، نمسح الأصل المحدد
  useEffect(() => {
    setFormData((prev) => ({ ...prev, assetId: "" }));
  }, [roomId, formData.assetTypeId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const imageFiles = selected.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== selected.length) {
      toast.warning(t("onlyImagesSupported"));
    }
    setFiles((prev) => [...prev, ...imageFiles]);
    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }
    if (!roomId) {
      toast.error(t("locationRequired"));
      return;
    }
    if (!branchId) {
      toast.error(t("branchRequired"));
      return;
    }
    if (!formData.reporterName || !formData.reporterEmail) {
      toast.error(t("reporterRequired"));
      return;
    }

    setIsSubmitting(true);
    const payload = new FormData();
    payload.append("type", formData.type);
    payload.append("title", formData.title);
    payload.append("description", formData.description);
    payload.append("roomId", roomId);
    payload.append("branchId", branchId);
    if (formData.assetId && formData.assetId !== "none") {
      payload.append("assetId", formData.assetId);
    }
    payload.append("reporterName", formData.reporterName);
    payload.append("reporterEmail", formData.reporterEmail);
    if (formData.phone) payload.append("phone", formData.phone);
    files.forEach((file) => payload.append("images", file));

    try {
      const res = await fetch("/api/tickets", { method: "POST", body: payload });
      if (res.ok) {
        toast.success(t("createSuccess"));
        router.push(`/${locale}/tickets`);
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

  const ticketTypeMap: Record<string, string> = {
    MAINTENANCE: isRtl ? "بلاغ صيانة" : "Maintenance Ticket",
    INCIDENT: isRtl ? "بلاغ حادث" : "Incident Ticket",
  };

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {isRtl ? "إنشاء بلاغ جديد" : "New Ticket"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRtl
                ? "أدخل تفاصيل البلاغ وارفع الصور (اختياري)"
                : "Enter ticket details and upload images (optional)"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الرئيسي */}
        <div className="lg:col-span-2 space-y-8">
          {/* تفاصيل البلاغ */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
                <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "تفاصيل البلاغ" : "Ticket Details"}
              </h2>
            </div>

            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {isRtl ? "نوع البلاغ" : "Ticket Type"} <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
                      <SelectValue
                        placeholder={isRtl ? "اختر نوع البلاغ" : "Select ticket type"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAINTENANCE">
                        {ticketTypeMap.MAINTENANCE}
                      </SelectItem>
                      <SelectItem value="INCIDENT">
                        {ticketTypeMap.INCIDENT}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {isRtl ? "العنوان" : "Title"} <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    placeholder={
                      isRtl
                        ? "مثال: عطل في التكييف..."
                        : "e.g., AC malfunction..."
                    }
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {isRtl ? "الوصف" : "Description"} <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  required
                  placeholder={
                    isRtl ? "يرجى كتابة التفاصيل..." : "Please provide details..."
                  }
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[120px]"
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
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "تفاصيل الموقع" : "Location Details"}
                <span className="text-rose-500 text-sm ml-1">*</span>
              </h2>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-indigo-400" />
                    {isRtl ? "المبنى أو المنطقة" : "Building / Zone"}
                  </Label>
                  <BuildingSelector
                    className="w-full"
                    value={buildingId}
                    onValueChange={(val) => {
                      setBuildingId(val);
                      setFloorId("");
                      setRoomId("");
                    }}
                    buildings={buildings}
                    loading={loadingBuildings}
                    placeholder={isRtl ? "اختر المبنى" : "Select building"}
                    emptyMessage={isRtl ? "لا توجد مباني" : "No buildings"}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-indigo-400" />
                    {isRtl ? "الدور أو المنطقة" : "Floor / Zone"}
                  </Label>
                  <FloorSelector
                    className="w-full"
                    value={floorId}
                    onValueChange={(val) => {
                      setFloorId(val);
                      setRoomId("");
                    }}
                    floors={floors}
                    buildingId={buildingId}
                    loading={loadingFloors}
                    placeholder={isRtl ? "اختر الدور" : "Select floor"}
                    emptyMessage={isRtl ? "لا توجد أدوار" : "No floors"}
                    noBuildingMessage={isRtl ? "اختر مبنى أولاً" : "Select building first"}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <DoorOpen className="h-4 w-4 text-indigo-400" />
                    {isRtl ? "الوحدة" : "Unit"}
                  </Label>
                  <RoomSelector
                    className="w-full"
                    value={roomId}
                    onValueChange={setRoomId}
                    rooms={rooms}
                    floorId={floorId}
                    loading={loadingRooms}
                    placeholder={isRtl ? "اختر الغرفة" : "Select room"}
                    emptyMessage={isRtl ? "لا توجد غرف" : "No rooms"}
                    noFloorMessage={isRtl ? "اختر دور أولاً" : "Select floor first"}
                  />
                </div>
              </div>

              {roomId && (() => {
                const selectedRoom = rooms.find((r) => r.id === roomId);
                if (!selectedRoom) return null;
                return (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {isRtl ? "الوحدة المختارة:" : "Selected Unit:"}
                    </span>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {selectedRoom.name}{" "}
                      {selectedRoom.fullCode && `(${selectedRoom.fullCode})`}
                    </span>
                  </div>
                );
              })()}
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
                  {isRtl ? "نوع الأصل" : "Asset Type"}
                </Label>
                <Select
                  value={formData.assetTypeId}
                  onValueChange={(val) => {
                    setFormData((prev) => ({ ...prev, assetTypeId: val, assetId: "" }));
                  }}
                  disabled={!roomId}
                >
                  <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
                    <SelectValue
                      placeholder={
                        roomId
                          ? isRtl
                            ? "اختر نوع الأصل"
                            : "Select asset type"
                          : isRtl
                          ? "اختر الموقع أولاً"
                          : "Select location first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{isRtl ? "جميع الأنواع" : "All types"}</SelectItem>
                    {assetTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} {type.code ? `(${type.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {isRtl ? "الأصل (اختياري)" : "Asset (Optional)"}
                </Label>
                <Select
                  value={formData.assetId}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, assetId: val }))
                  }
                  disabled={!roomId || loadingAssets}
                >
                  <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
                    <SelectValue
                      placeholder={
                        loadingAssets
                          ? isRtl
                            ? "جار التحميل..."
                            : "Loading..."
                          : !roomId
                          ? isRtl
                            ? "اختر الموقع أولاً"
                            : "Select location first"
                          : assets.length === 0
                          ? isRtl
                            ? "لا توجد أصول في هذا الموقع"
                            : "No assets at this location"
                          : isRtl
                          ? "اختر الأصل"
                          : "Select asset"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {isRtl ? asset.name : asset.nameEn || asset.name} ({asset.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {roomId && !loadingAssets && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {assets.length} {isRtl ? "أصل متاح" : "asset(s) available"}
                  </p>
                )}
              </div>

              {formData.assetId &&
                (() => {
                  const selectedAsset = assets.find((a) => a.id === formData.assetId);
                  if (!selectedAsset) return null;
                  return (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {isRtl ? "الأصل المختار:" : "Selected Asset:"}
                      </span>
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {isRtl ? selectedAsset.name : selectedAsset.nameEn || selectedAsset.name} ({selectedAsset.code})
                      </span>
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>

        {/* العمود الجانبي */}
        <div className="space-y-6">
          {/* بيانات المبلّغ */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "بيانات المبلّغ" : "Reporter Info"}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {isRtl ? "الاسم" : "Name"} <span className="text-rose-500">*</span>
                </Label>
                <Input
                  required
                  value={formData.reporterName}
                  onChange={(e) =>
                    setFormData({ ...formData, reporterName: e.target.value })
                  }
                  className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {isRtl ? "البريد الإلكتروني" : "Email"} <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="email"
                  required
                  value={formData.reporterEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, reporterEmail: e.target.value })
                  }
                  className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {isRtl ? "رقم التواصل (اختياري)" : "Phone (Optional)"}
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                />
              </div>
            </div>
          </div>

          {/* الفرع */}
          <div className={cn(glassCard, "border-indigo-200/30 dark:border-indigo-800/30 border-2")}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                <Building className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "الفرع" : "Branch"} <span className="text-rose-500">*</span>
              </h3>
            </div>
            <BranchSelector className="w-full" value={branchId} onValueChange={setBranchId} />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
              {isRtl
                ? "الفرع الذي سيتم توجيه البلاغ إليه."
                : "The branch to which the ticket will be routed."}
            </p>
          </div>

          {/* رفع الصور */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                <ImageIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "رفع صور (اختياري)" : "Upload Images (Optional)"}
              </h3>
            </div>

            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="w-full cursor-pointer rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50"
              />

              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={src}
                        alt={`preview-${idx}`}
                        className="w-full h-24 object-cover rounded-xl border border-slate-200/50 dark:border-slate-700/50"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-500/90 text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-400 dark:text-slate-500">
                {isRtl
                  ? "يمكنك رفع عدة صور بصيغة JPG, PNG, GIF"
                  : "You can upload multiple images (JPG, PNG, GIF)"}
              </p>
            </div>
          </div>

          {/* مساعدة سريعة */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
            <Shield className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              {isRtl
                ? "سيتم إنشاء طلب عمل تلقائياً بعد قبول البلاغ."
                : "A work order will be created automatically upon approval."}
            </div>
          </div>

          {/* الأزرار */}
          <div className="flex gap-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12 font-medium"
            >
              <X className="h-4 w-4 mr-2" />
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5 mr-2" />
              )}
              {isRtl ? "إرسال البلاغ" : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}