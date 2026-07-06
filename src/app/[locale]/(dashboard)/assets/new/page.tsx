// src/app/[locale]/(dashboard)/assets/new/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
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
import {
  Calendar,
  MapPin,
  FileText,
  Loader2,
  Plus,
  ShieldCheck,
  Info,
  Globe,
  Building as BuildingIcon,
  Layers,
  DoorOpen,
  Wrench,
  Upload,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
import type { AssetStatus, AssetType, Building, Floor, Room } from "@/types/assets";

// =========================
// دالة توليد الكود التسلسلي
// =========================
const generateSequentialCode = async (
  typeId: string | null,
  roomId: string
): Promise<string> => {
  const params = new URLSearchParams();
  if (typeId) params.append("typeId", typeId);
  if (roomId) params.append("roomId", roomId);
  const res = await fetch(`/api/assets/next-code?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to generate code");
  const data = await res.json();
  return data.code;
};

// =========================
// المكون الرئيسي
// =========================
export default function NewAssetPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("AssetsForm");
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<AssetStatus[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildingId, setBuildingId] = useState<string>("");
  const [floorId, setFloorId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoomFullCode, setSelectedRoomFullCode] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    description: "",
    descriptionEn: "",
    typeId: "",
    statusId: "",
    purchaseDate: "",
    warrantyEnd: "",
    lastMaintenanceDate: "",
    roomId: "",
    notes: "",
  });

  // كرت الخلفية الزجاجي
  const glassCard =
    "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

  const normalizeBuilding = (b: Building) => ({ ...b, nameEn: b.nameEn ?? undefined });
  const normalizeFloor = (f: Floor) => ({ ...f, nameEn: f.nameEn ?? undefined });
  const normalizeRoom = (r: Room) => ({ ...r, nameEn: r.nameEn ?? undefined });

  // =========================
  // جلب البيانات الأولية
  // =========================
  useEffect(() => {
    const fetchData = async () => {
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
        toast.error(t("fetchError"));
      }
    };
    fetchData();
  }, [locale, t]);

  // جلب الأدوار
  useEffect(() => {
    if (!buildingId) {
      setFloors([]);
      return;
    }
    async function fetchFloors() {
      setLoadingFloors(true);
      try {
        const res = await fetch(`/api/buildings/${buildingId}/floors`);
        if (res.ok) setFloors(await res.json());
        else setFloors([]);
      } catch {
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    }
    fetchFloors();
  }, [buildingId]);

  // جلب الغرف
  useEffect(() => {
    if (!floorId) {
      setRooms([]);
      setSelectedRoomFullCode("");
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

          const roomsWithCode = data.map((room: any) => ({
            id: room.id,
            name: room.name,
            nameEn: room.nameEn ?? undefined,
            floorId: floorId,
            buildingId: buildingId,
            code: room.code || "",
            fullCode: `${buildingCode}-${floorCode}-${room.code || ""}`,
          }));
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

  // =========================
  // دوال التحكم
  // =========================
  const handleBuildingChange = (value: string) => {
    setBuildingId(value);
    setFloorId("");
    setRoomId("");
    setFormData((prev) => ({ ...prev, roomId: "" }));
    setSelectedRoomFullCode("");
  };

  const handleFloorChange = (value: string) => {
    setFloorId(value);
    setRoomId("");
    setFormData((prev) => ({ ...prev, roomId: "" }));
    setSelectedRoomFullCode("");
  };

  const handleRoomChange = (value: string) => {
    setRoomId(value);
    setFormData((prev) => ({ ...prev, roomId: value }));
    const selectedRoom = rooms.find((r) => r.id === value);
    setSelectedRoomFullCode(selectedRoom?.fullCode || "");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // =========================
  // الإرسال
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    if (!formData.typeId || formData.typeId === "all") {
      toast.error(isRtl ? "يرجى اختيار نوع الأصل" : "Please select an asset type");
      return;
    }

    if (!roomId) {
      toast.error(t("locationRequired"));
      return;
    }

    setLoading(true);
    try {
      const sequentialCode = await generateSequentialCode(
        formData.typeId || null,
        roomId
      );
      const cleanTypeId =
        formData.typeId && formData.typeId !== "all" ? formData.typeId : null;
      const cleanStatusId =
        formData.statusId && formData.statusId !== "all"
          ? formData.statusId
          : null;

      const payload = {
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim() || null,
        description: formData.description.trim() || null,
        descriptionEn: formData.descriptionEn.trim() || null,
        code: sequentialCode,
        typeId: cleanTypeId,
        statusId: cleanStatusId,
        purchaseDate: formData.purchaseDate || null,
        warrantyEnd: formData.warrantyEnd || null,
        lastMaintenanceDate: formData.lastMaintenanceDate || null,
        roomId: roomId,
        notes: formData.notes || null,
      };

      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        data = { error: rawText };
      }

      if (res.ok) {
        toast.success(t("createSuccess"));
        router.push(`/${locale}/assets`);
        router.refresh();
      } else {
        toast.error(data.error || `${t("createError")}: ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("createError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Plus className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t("pageTitle")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("pageSubtitle")}
            </p>
          </div>
        </div>
        <Link href={`/${locale}/assets/bulk-import`}>
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 gap-2"
          >
            <Upload className="h-4 w-4" />
            {t("bulkImportBtn")}
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الرئيسي (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* المعلومات الأساسية */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("basicInfo")}
                </h2>
              </div>

              <div className="space-y-5">
                {/* الاسم العربي */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("name")} <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("namePlaceholder")}
                    required
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                  />
                </div>

                {/* الاسم الإنجليزي */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-indigo-400" />
                    {t("nameEn")}
                  </Label>
                  <Input
                    name="nameEn"
                    value={formData.nameEn}
                    onChange={handleChange}
                    placeholder={t("nameEnPlaceholder")}
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                  />
                </div>

                {/* الوصف العربي */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {isRtl ? "الوصف (عربي)" : "Description (Arabic)"}
                  </Label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={isRtl ? "أدخل وصفاً عربياً للأصل (اختياري)" : "Enter an Arabic description (optional)"}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[80px]"
                  />
                </div>

                {/* الوصف الإنجليزي */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-indigo-400" />
                    {isRtl ? "الوصف (English)" : "Description (English)"}
                  </Label>
                  <Textarea
                    name="descriptionEn"
                    value={formData.descriptionEn}
                    onChange={handleChange}
                    placeholder={isRtl ? "أدخل وصفاً إنجليزياً للأصل (اختياري)" : "Enter an English description (optional)"}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[80px]"
                  />
                </div>

                {/* النوع والحالة */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {t("type")} <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={formData.typeId}
                      onValueChange={(v) => handleSelectChange("typeId", v)}
                      disabled={types.length === 0}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
                        <SelectValue placeholder={t("selectType")} />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {isRtl ? type.name : type.nameEn || type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {t("status")}
                    </Label>
                    <Select
                      value={formData.statusId}
                      onValueChange={(v) => handleSelectChange("statusId", v)}
                      disabled={statuses.length === 0}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
                        <SelectValue placeholder={t("selectStatus")} />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id.toString()}>
                            {isRtl ? status.name : status.nameEn || status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* الموقع */}
                <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                      <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100">
                      {t("locationDetails")}
                      <span className="text-rose-500 text-sm ml-1">*</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <BuildingIcon className="h-4 w-4 text-indigo-400" />
                        {t("selectBuilding")}
                      </Label>
                      <BuildingSelector
                        value={buildingId}
                        onValueChange={handleBuildingChange}
                        buildings={buildings.map(normalizeBuilding)}
                        loading={buildings.length === 0}
                        placeholder={t("selectBuilding")}
                        emptyMessage={t("noBuildings")}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-indigo-400" />
                        {t("selectFloor")}
                      </Label>
                      <FloorSelector
                        value={floorId}
                        onValueChange={handleFloorChange}
                        floors={floors.map(normalizeFloor)}
                        buildingId={buildingId}
                        loading={loadingFloors}
                        placeholder={t("selectFloor")}
                        emptyMessage={t("noFloors")}
                        noBuildingMessage={t("selectBuildingFirst")}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <DoorOpen className="h-4 w-4 text-indigo-400" />
                        {t("selectRoom")}
                      </Label>
                      <RoomSelector
                        value={roomId}
                        onValueChange={handleRoomChange}
                        rooms={rooms.map(normalizeRoom)}
                        floorId={floorId}
                        loading={loadingRooms}
                        placeholder={t("selectRoom")}
                        emptyMessage={t("noRooms")}
                        noFloorMessage={t("selectFloorFirst")}
                      />
                    </div>
                  </div>

                  {selectedRoomFullCode && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {t("selectedRoom")}
                      </span>
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {selectedRoomFullCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* دورة الحياة */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                  <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("lifecycle")}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-indigo-400" />
                    {t("purchaseDate")}
                  </Label>
                  <Input
                    name="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    {t("warrantyEnd")}
                  </Label>
                  <Input
                    name="warrantyEnd"
                    type="date"
                    value={formData.warrantyEnd}
                    onChange={handleChange}
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-amber-400" />
                    {t("lastMaintenance")}
                  </Label>
                  <div className="relative">
                    <Input
                      name="lastMaintenanceDate"
                      type="date"
                      value={formData.lastMaintenanceDate}
                      onChange={handleChange}
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                    />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    {t("lastMaintenanceHint")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* العمود الجانبي (1/3) */}
          <div className="space-y-6">
            {/* الملاحظات */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                  <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("notes")}
                </h3>
              </div>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder={t("notesPlaceholder")}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[120px]"
              />
              <div className="mt-4 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
                <Info className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t("infoText")}
                </p>
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
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {t("submit")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}