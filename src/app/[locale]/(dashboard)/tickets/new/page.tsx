// src/app/[locale]/(dashboard)/tickets/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  User,
  Send,
  Loader2,
  X,
  MapPin,
  Building,
  Layers,
  DoorOpen,
  AlertCircle,
  FileText,
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

import { BranchSelector } from "@/components/shared/BranchSelector";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";

// =========================
// أنواع البيانات
// =========================
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

interface ApiRoom {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
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

  const [branchId, setBranchId] = useState<string>("");
  const [buildingId, setBuildingId] = useState<string>("");
  const [floorId, setFloorId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // ✅ تهيئة formData مباشرة باستخدام session
  const [formData, setFormData] = useState({
    type: "MAINTENANCE",
    title: "",
    description: "",
    assetTypeId: "",
    assetId: "",
    reporterName: session?.user?.name ?? "",
    reporterEmail: session?.user?.email ?? "",
    phone: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const glassCard =
    "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

  // جلب أنواع الأصول فقط في البداية
  useEffect(() => {
    async function fetchAssetTypes() {
      try {
        const res = await fetch("/api/asset-types");
        const data = await res.json();
        setAssetTypes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        toast.error(t("fetchError"));
      } finally {
        setDataLoaded(true);
      }
    }
    fetchAssetTypes();
  }, [t]);

  // جلب المباني بناءً على الفرع المختار
    useEffect(() => {
      if (!branchId) {
        return;
      }

      async function fetchBuildings() {
      setLoadingBuildings(true);
      try {
        const res = await fetch(`/api/locations/buildings?branchId=${branchId}`);
        if (res.ok) {
          const data = await res.json();
          setBuildings(Array.isArray(data) ? data : []);
        } else {
          setBuildings([]);
        }
      } catch {
        setBuildings([]);
      } finally {
        setLoadingBuildings(false);
      }
    }
    fetchBuildings();
  }, [branchId]);

  // جلب الأدوار بناءً على المبنى المختار
  useEffect(() => {
    if (!buildingId) {
      return;
    }

    async function fetchFloors() {
      setLoadingFloors(true);
      try {
        const res = await fetch(`/api/locations/buildings/${buildingId}/floors`);
        if (res.ok) {
          const data = await res.json();
          setFloors(Array.isArray(data) ? data : []);
        } else {
          setFloors([]);
        }
      } catch {
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    }
    fetchFloors();
  }, [buildingId]);

  // جلب الغرف بناءً على الدور المختار
  useEffect(() => {
    if (!floorId) {
      return;
    }

    async function fetchRooms() {
      setLoadingRooms(true);
      try {
        const res = await fetch(`/api/locations/floors/${floorId}/rooms`);
        if (res.ok) {
          const data = await res.json();
          const currentBuilding = buildings.find((b) => b.id === buildingId);
          const currentFloor = floors.find((f) => f.id === floorId);
          const buildingCode = currentBuilding?.code || "";
          const floorCode = currentFloor?.code || "";
          const roomsWithCode = (Array.isArray(data) ? data : []).map(
            (room: ApiRoom) => ({
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
        } else {
          setRooms([]);
        }
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    }
    fetchRooms();
  }, [floorId, buildingId, buildings, floors]);

  // ✅ جلب الأصول فقط عند وجود roomId و assetTypeId معاً
  useEffect(() => {
    if (!roomId || !formData.assetTypeId) {
      return;
    }

    const abortController = new AbortController();

    const fetchAssets = async () => {
      setLoadingAssets(true);

      try {
        const params = new URLSearchParams();
        params.append("roomId", roomId);
        params.append("typeId", formData.assetTypeId);
        params.append("limit", "100");

        const res = await fetch(`/api/assets?${params.toString()}`, {
          signal: abortController.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch assets");
        }

        const data = await res.json();

        const assetsData = Array.isArray(data)
          ? data
          : Array.isArray(data.assets)
          ? data.assets
          : [];

        setAssets(assetsData);
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching assets:", error);
          setAssets([]);
          toast.error(t("fetchError"));
        }
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();

    return () => abortController.abort();
  }, [roomId, formData.assetTypeId, t]);

  // المتغيرات المشتقة
  const visibleFloors = buildingId ? floors : [];
  const visibleRooms = floorId ? rooms : [];
  const visibleAssets = roomId && formData.assetTypeId ? assets : [];

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

  if (!dataLoaded) {
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
          {/* حاوية تفاصيل البلاغ */}
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

          {/* حاوية موقع البلاغ (الفرع + الموقع) */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "موقع البلاغ" : "Ticket Location"}
                <span className="text-rose-500 text-sm ml-1">*</span>
              </h2>
            </div>

            <div className="space-y-5">
              {/* الفرع */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-indigo-400" />
                  {isRtl ? "الفرع" : "Branch"} <span className="text-rose-500">*</span>
                </Label>
                <BranchSelector
                  className="w-full"
                  value={branchId}
                  onValueChange={(val) => {
                    setBranchId(val);
                    setBuildingId("");
                    setFloorId("");
                    setRoomId("");
                    setAssets([]);
                    setFormData((prev) => ({
                      ...prev,
                      assetTypeId: "",
                      assetId: "",
                    }));
                  }}
                />
              </div>

              {/* المبنى والدور والوحدة في صف واحد */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-indigo-400" />
                    {isRtl ? "المبنى / المنطقة" : "Building / Zone"}
                  </Label>
                  <BuildingSelector
                    className="w-full"
                    value={buildingId}
                    onValueChange={(val) => {
                      setBuildingId(val);
                      setFloorId("");
                      setRoomId("");
                      setFloors([]);
                      setRooms([]);
                      setAssets([]);
                      setLoadingFloors(false);
                      setLoadingRooms(false);
                      setLoadingAssets(false);
                      setFormData((prev) => ({
                        ...prev,
                        assetTypeId: "",
                        assetId: "",
                      }));
                    }}
                    buildings={buildings}
                    loading={loadingBuildings}
                    placeholder={isRtl ? "اختر المبنى" : "Select building"}
                    emptyMessage={isRtl ? "لا توجد مباني" : "No buildings"}
                    disabled={!branchId}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-indigo-400" />
                    {isRtl ? "الدور / المنطقة" : "Floor / Zone"}
                  </Label>
                  <FloorSelector
                    className="w-full"
                    value={floorId}
                    onValueChange={(val) => {
                      setFloorId(val);
                      setRoomId("");
                      setRooms([]);
                      setAssets([]);
                      setLoadingRooms(false);
                      setLoadingAssets(false);
                      setFormData((prev) => ({
                        ...prev,
                        assetTypeId: "",
                        assetId: "",
                      }));
                    }}
                    floors={visibleFloors}
                    buildingId={buildingId}
                    loading={loadingFloors}
                    placeholder={isRtl ? "اختر الدور" : "Select floor"}
                    emptyMessage={isRtl ? "لا توجد أدوار" : "No floors"}
                    noBuildingMessage={isRtl ? "اختر مبنى أولاً" : "Select building first"}
                    disabled={!buildingId}
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
                    onValueChange={(val) => {
                      setRoomId(val);
                      setAssets([]);
                      setLoadingAssets(false);
                      setFormData((prev) => ({
                        ...prev,
                        assetTypeId: "",
                        assetId: "",
                      }));
                    }}
                    rooms={visibleRooms}
                    floorId={floorId}
                    loading={loadingRooms}
                    placeholder={isRtl ? "اختر الغرفة" : "Select room"}
                    emptyMessage={isRtl ? "لا توجد غرف" : "No rooms"}
                    noFloorMessage={isRtl ? "اختر دور أولاً" : "Select floor first"}
                    disabled={!floorId}
                  />
                </div>
              </div>

              {/* عرض الوحدة المختارة */}
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

          {/* حاوية الأصل المرتبط (اختياري) */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "الأصل المرتبط (اختياري)" : "Asset Details (Optional)"}
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
                    setFormData((prev) => ({
                      ...prev,
                      assetTypeId: val,
                      assetId: "",
                    }));
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
                          ? "اختر الغرفة أولاً"
                          : "Select room first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
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
                  {isRtl ? "الأصل" : "Asset"}
                </Label>
                <Select
                  value={formData.assetId}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, assetId: val }))
                  }
                  disabled={!roomId || !formData.assetTypeId || loadingAssets}
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
                            ? "اختر الغرفة أولاً"
                            : "Select room first"
                          : !formData.assetTypeId
                          ? isRtl
                            ? "اختر نوع الأصل أولاً"
                            : "Select asset type first"
                          : visibleAssets.length === 0
                          ? isRtl
                            ? "لا توجد أصول من هذا النوع في هذه الغرفة"
                            : "No assets of this type in this room"
                          : isRtl
                          ? "اختر الأصل"
                          : "Select asset"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleAssets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {isRtl ? asset.name : asset.nameEn || asset.name} ({asset.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {roomId && formData.assetTypeId && !loadingAssets && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {visibleAssets.length} {isRtl ? "أصل متاح" : "asset(s) available"}
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
                      <Image
                        src={src}
                        alt={`preview-${idx}`}
                        width={200}
                        height={100}
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