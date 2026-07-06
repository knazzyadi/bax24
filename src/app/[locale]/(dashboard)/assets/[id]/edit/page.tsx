// src/app/[locale]/(dashboard)/assets/[id]/edit/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  FileText,
  Loader2,
  ShieldCheck,
  Info,
  Globe,
  Save,
  ArrowLeft,
  Wrench,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { LocationSelector, type LocationValue } from "@/components/shared/LocationSelector";
import type { AssetStatus, AssetType, Building, Floor, Room } from "@/types/assets";

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const assetId = params.id as string;
  const t = useTranslations("AssetsForm");
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statuses, setStatuses] = useState<AssetStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [statusesError, setStatusesError] = useState<string | null>(null);
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

  // ========== تحسين: useMemo لخريطة أسماء الحالات ==========
  const statusNameMap = useMemo(() => {
    const map = new Map<string, string>();
    statuses.forEach((s) => {
      map.set(s.id, isRtl ? s.name : s.nameEn || s.name);
    });
    return map;
  }, [statuses, isRtl]);

  const getStatusName = useCallback(
    (statusId: string) => {
      return statusNameMap.get(statusId) || t("selectStatus");
    },
    [statusNameMap, t]
  );

  // ========== جلب البيانات الأساسية (الحالات، الأنواع، المباني) ==========
  const fetchMeta = useCallback(async () => {
    setLoadingStatuses(true);
    setStatusesError(null);

    try {
      const [statusesRes, typesRes, buildingsRes] = await Promise.all([
        fetch(`/api/asset-statuses?locale=${locale}`),
        fetch(`/api/asset-types?locale=${locale}`),
        fetch(`/api/buildings`),
      ]);

      if (statusesRes.ok) {
        const data = await statusesRes.json();
        setStatuses(data);
      } else {
        setStatusesError(isRtl ? "فشل تحميل الحالات" : "Failed to load statuses");
      }

      if (typesRes.ok) setTypes(await typesRes.json());
      if (buildingsRes.ok) setBuildings(await buildingsRes.json());
    } catch (err) {
      setStatusesError(isRtl ? "خطأ في الاتصال بالخادم" : "Server connection error");
      toast.error(t("fetchError"));
    } finally {
      setLoadingStatuses(false);
    }
  }, [locale, isRtl, t]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  // ========== جلب بيانات الأصل الحالي ==========
  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await fetch(`/api/assets/${assetId}`);
        if (!res.ok) throw new Error("Asset not found");
        const asset = await res.json();
        setFormData({
          name: asset.name || "",
          nameEn: asset.nameEn || "",
          description: asset.description || "",
          descriptionEn: asset.descriptionEn || "",
          typeId: asset.typeId || "",
          statusId: asset.statusId || "",
          purchaseDate: asset.purchaseDate ? asset.purchaseDate.split("T")[0] : "",
          warrantyEnd: asset.warrantyEnd ? asset.warrantyEnd.split("T")[0] : "",
          lastMaintenanceDate: asset.lastMaintenanceDate
            ? asset.lastMaintenanceDate.split("T")[0]
            : "",
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
        toast.error(t("fetchError"));
      } finally {
        setLoading(false);
      }
    };
    if (assetId) fetchAsset();
  }, [assetId, t]);

  // ========== عند تغيير الموقع ==========
  const handleLocationChange = (location: LocationValue) => {
    setSelectedBuildingId(location.buildingId);
    setSelectedFloorId(location.floorId);
    setRoomId(location.roomId);
    setFormData((prev) => ({ ...prev, roomId: location.roomId }));
  };

  // ========== جلب تفاصيل الغرفة ==========
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
          setSelectedRoomName(isRtl ? roomData.name : roomData.nameEn || roomData.name);
        } else {
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getTypeName = (typeId: string) => {
    const type = types.find((t) => t.id === typeId);
    if (!type) return t("selectType");
    return isRtl ? type.name : type.nameEn || type.name;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    if (!roomId) {
      toast.error(t("locationRequired"));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim() || null,
        description: formData.description.trim() || null,
        descriptionEn: formData.descriptionEn.trim() || null,
        typeId: formData.typeId || null,
        statusId: formData.statusId || null,
        purchaseDate: formData.purchaseDate || null,
        warrantyEnd: formData.warrantyEnd || null,
        lastMaintenanceDate: formData.lastMaintenanceDate || null,
        roomId,
        notes: formData.notes || null,
      };
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(t("updateSuccess", { fallback: "Asset updated successfully" }));
        router.push(`/${locale}/assets`);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || t("updateError"));
      }
    } catch (err) {
      toast.error(t("updateError"));
    } finally {
      setSaving(false);
    }
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
              {t("editTitle", { fallback: isRtl ? "تعديل أصل" : "Edit Asset" })}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("editSubtitle", { fallback: isRtl ? "تعديل بيانات الأصل" : "Edit asset details" })}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          {isRtl ? "العودة" : "Back"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الرئيسي (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* بطاقة المعلومات الأساسية */}
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

                {/* الوصف العربي */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {isRtl ? "الوصف (عربي)" : "Description (Arabic)"}
                  </Label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={
                      isRtl
                        ? "أدخل وصفاً عربياً للأصل (اختياري)"
                        : "Enter an Arabic description (optional)"
                    }
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[80px]"
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
                    placeholder={
                      isRtl
                        ? "أدخل وصفاً إنجليزياً للأصل (اختياري)"
                        : "Enter an English description (optional)"
                    }
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[80px]"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* النوع (معطل) */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      {t("type")}
                      <span className="text-xs text-rose-500 font-normal">
                        (لا يمكن التعديل)
                      </span>
                    </Label>
                    <Select
                      value={formData.typeId}
                      onValueChange={(v) => handleSelectChange("typeId", v)}
                      disabled
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-gray-100 dark:bg-gray-800 text-muted-foreground cursor-not-allowed px-4">
                        {getTypeName(formData.typeId) || (
                          <SelectValue placeholder={t("selectType")} />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {isRtl ? type.name : type.nameEn || type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      {isRtl
                        ? "لا يمكن تغيير نوع الأصل بعد الإنشاء."
                        : "Asset type cannot be changed after creation."}
                    </p>
                  </div>

                  {/* الحالة */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {t("status")}
                    </Label>
                    {loadingStatuses ? (
                      <div className="h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center px-4 text-slate-400 animate-pulse">
                        {isRtl ? "جاري تحميل الحالات..." : "Loading statuses..."}
                      </div>
                    ) : statusesError ? (
                      <div className="flex items-center gap-2">
                        <div className="h-12 flex-1 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 flex items-center px-4 text-rose-600 dark:text-rose-400 text-sm">
                          {statusesError}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchMeta}
                          className="h-12 px-4 rounded-xl border-slate-200 dark:border-slate-800"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : statuses.length === 0 ? (
                      <div className="h-12 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 flex items-center px-4 text-rose-600 dark:text-rose-400 text-sm">
                        {isRtl
                          ? "لا توجد حالات. يرجى إضافة حالة أولاً."
                          : "No statuses available. Please add one."}
                      </div>
                    ) : (
                      <Select
                        value={formData.statusId}
                        onValueChange={(v) => handleSelectChange("statusId", v)}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
                          <SelectValue placeholder={t("selectStatus")} />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: status.color || "#6b7280" }}
                                />
                                {isRtl ? status.name : status.nameEn || status.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* بطاقة الموقع */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("location")} <span className="text-rose-500">*</span>
                </h2>
              </div>

              <div className="space-y-4">
                <LocationSelector
                  value={{
                    buildingId: selectedBuildingId,
                    floorId: selectedFloorId,
                    roomId,
                  }}
                  onChange={handleLocationChange}
                />
                {selectedRoomFullCode && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {isRtl ? "الموقع المختار:" : "Selected Location:"}
                    </span>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {selectedRoomName} — {selectedRoomFullCode}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* بطاقة دورة الحياة */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                  <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("lifecycle")}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("purchaseDate")}
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <Input
                      name="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={handleChange}
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all pr-10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("warrantyEnd")}
                  </Label>
                  <div className="relative">
                    <ShieldCheck className="absolute right-3 top-3.5 h-5 w-5 text-emerald-500/70" />
                    <Input
                      name="warrantyEnd"
                      type="date"
                      value={formData.warrantyEnd}
                      onChange={handleChange}
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-emerald-500/50 transition-all pr-10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-slate-400" />
                    {t("lastMaintenance")}
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <Input
                      name="lastMaintenanceDate"
                      type="date"
                      value={formData.lastMaintenanceDate}
                      onChange={handleChange}
                      className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all pr-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* العمود الجانبي (1/3) */}
          <div className="space-y-6">
            {/* بطاقة الملاحظات */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("notes")}
                </h3>
              </div>

              <div className="space-y-4">
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder={t("notesPlaceholder")}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[120px] resize-none"
                />
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/30 flex items-start gap-3">
                  <Info className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("infoText")}
                  </p>
                </div>
              </div>
            </div>

            {/* مساعدة سريعة */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                {isRtl
                  ? "تأكد من تحديث جميع الحقول المطلوبة (الاسم والموقع) قبل الحفظ."
                  : "Make sure to update all required fields (name and location) before saving."}
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
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5 ml-2" />
                )}
                {t("submit")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}