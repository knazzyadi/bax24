// src/app/[locale]/(dashboard)/tickets/[id]/edit/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  FileText,
  MapPin,
  User,
  Info,
  Save,
  X,
  Loader2,
  Image as ImageIcon,
  Upload,
  Trash2,
  Sparkles,
  Shield,
  ArrowLeft,
  AlertCircle,
  Building,
  Layers,
  DoorOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BranchSelector } from "@/components/shared/BranchSelector";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";

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

export default function EditTicketPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const locale = useLocale();
  const t = useTranslations("TicketsForm");
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // بيانات الموقع الهرمي
  const [buildingId, setBuildingId] = useState<string>("");
  const [floorId, setFloorId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // حالة الصورة
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [deletingImage, setDeletingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // كرت الخلفية الزجاجي
  const glassCard =
    "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

  // جلب أنواع الأصول والمباني
  useEffect(() => {
    const controller = new AbortController();
    const fetchInitialData = async () => {
      try {
        const [assetTypesRes, buildingsRes] = await Promise.all([
          fetch("/api/asset-types", { signal: controller.signal }),
          fetch("/api/buildings", { signal: controller.signal }),
        ]);
        if (assetTypesRes.ok) {
          const data = await assetTypesRes.json();
          setAssetTypes(Array.isArray(data) ? data : []);
        }
        if (buildingsRes.ok) {
          const data = await buildingsRes.json();
          setBuildings(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Failed to fetch initial data", err);
      } finally {
        setLoadingBuildings(false);
      }
    };
    fetchInitialData();
    return () => controller.abort();
  }, []);

  // جلب الأدوار
  useEffect(() => {
    if (!buildingId) {
      setFloors([]);
      return;
    }
    const controller = new AbortController();
    const fetchFloors = async () => {
      setLoadingFloors(true);
      try {
        const res = await fetch(`/api/buildings/${buildingId}/floors`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setFloors(Array.isArray(data) ? data : []);
        } else setFloors([]);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    };
    fetchFloors();
    return () => controller.abort();
  }, [buildingId]);

  // جلب الغرف
  useEffect(() => {
    if (!floorId) {
      setRooms([]);
      return;
    }
    const controller = new AbortController();
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await fetch(`/api/floors/${floorId}/rooms`, {
          signal: controller.signal,
        });
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
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
    return () => controller.abort();
  }, [floorId, buildingId, buildings, floors]);

  // جلب الأصول بناءً على الغرفة ونوع الأصل
  useEffect(() => {
    if (!roomId) {
      setAssets([]);
      return;
    }
    const controller = new AbortController();
    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        let url = `/api/assets?roomId=${roomId}`;
        if (formData.assetTypeId) url += `&typeId=${formData.assetTypeId}`;
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          const assetsList = data.assets || data;
          setAssets(Array.isArray(assetsList) ? assetsList : []);
        } else setAssets([]);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Failed to fetch assets", err);
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchAssets();
    return () => controller.abort();
  }, [roomId, formData.assetTypeId]);

  // جلب بيانات التذكرة
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const fetchTicket = async () => {
      try {
        const res = await fetch(`/api/tickets/${id}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch ticket");
        const ticket = await res.json();
        const assetTypeId = ticket.asset?.typeId || "";

        setFormData({
          type: ticket.type || "MAINTENANCE",
          title: ticket.title || "",
          description: ticket.description || "",
          assetTypeId: assetTypeId,
          assetId: ticket.assetId || "",
          reporterName: ticket.reporterName || "",
          reporterEmail: ticket.reporterEmail || "",
          phone: ticket.phone || "",
        });

        if (ticket.imageUrl) {
          setCurrentImageUrl(ticket.imageUrl);
        }

        if (ticket.room) {
          setRoomId(ticket.room.id);
          if (ticket.room.floor) {
            setFloorId(ticket.room.floor.id);
            if (ticket.room.floor.building) {
              setBuildingId(ticket.room.floor.building.id);
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
        toast.error(t("fetchError"));
        router.push(`/${locale}/tickets`);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
    return () => controller.abort();
  }, [id, locale, router, t]);

  // معاينة الصورة عند اختيار ملف جديد
  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const handleDeleteImage = async () => {
    if (!currentImageUrl) return;
    setDeletingImage(true);
    try {
      const res = await fetch(`/api/tickets/${id}/image`, { method: "DELETE" });
      if (res.ok) {
        setCurrentImageUrl("");
        toast.success(t("imageDeleted"));
      } else {
        throw new Error();
      }
    } catch {
      toast.error(t("imageDeleteError"));
    } finally {
      setDeletingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.reporterName || !formData.reporterEmail) {
      toast.error(t("requiredFields"));
      return;
    }
    if (!roomId) {
      toast.error(t("locationRequired"));
      return;
    }

    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("type", formData.type);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("roomId", roomId);
      if (formData.assetId) formDataToSend.append("assetId", formData.assetId);
      formDataToSend.append("reporterName", formData.reporterName);
      formDataToSend.append("reporterEmail", formData.reporterEmail);
      if (formData.phone) formDataToSend.append("phone", formData.phone);

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        body: formDataToSend,
      });
      if (res.ok) {
        toast.success(t("updateSuccess"));
        router.push(`/${locale}/tickets/${id}`);
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || t("updateError"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("connectionError"));
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
              {t("editTitle")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("editSubtitle")}
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
          {/* العمود الرئيسي */}
          <div className="lg:col-span-2 space-y-8">
            {/* تفاصيل التذكرة */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
                  <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("ticketDetails")}
                </h2>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("type")} <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4">
                      <SelectValue placeholder={t("selectType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAINTENANCE">
                        {t("type_maintenance")}
                      </SelectItem>
                      <SelectItem value="INCIDENT">
                        {t("type_incident")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("title")} <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all text-base px-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("description")} <span className="text-rose-500">*</span>
                  </Label>
                  <Textarea
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[120px]"
                  />
                </div>

                {/* الموقع */}
                <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                      <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100">
                      {t("location")} <span className="text-rose-500">*</span>
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <Building className="h-4 w-4 text-indigo-400" />
                          {isRtl ? "المبنى أو المنطقة" : "Building / Zone"}
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
                    </div>

                    {roomId &&
                      (() => {
                        const selectedRoom = rooms.find((r) => r.id === roomId);
                        if (!selectedRoom) return null;
                        return (
                          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                              {isRtl ? "الموقع المختار:" : "Selected Location:"}
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
                <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40">
                      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100">
                      {isRtl ? "بيانات الأصل (اختياري)" : "Asset Details (Optional)"}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {t("assetType")}
                      </Label>
                      <Select
                        value={formData.assetTypeId}
                        disabled={!roomId || assetTypes.length === 0}
                        onValueChange={(v) =>
                          setFormData({
                            ...formData,
                            assetTypeId: v,
                            assetId: "",
                          })
                        }
                      >
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4 disabled:opacity-50">
                          <SelectValue placeholder={t("selectAssetType")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">{t("none")}</SelectItem>
                          {assetTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {isRtl ? type.name : type.nameEn || type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {t("assetName")}
                      </Label>
                      <Select
                        value={formData.assetId}
                        disabled={!roomId || loadingAssets}
                        onValueChange={(v) =>
                          setFormData({ ...formData, assetId: v })
                        }
                      >
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4 disabled:opacity-50">
                          <SelectValue placeholder={t("selectAsset")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">{t("none")}</SelectItem>
                          {assets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {isRtl ? asset.name : asset.nameEn || asset.name} (
                              {asset.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {roomId && !loadingAssets && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {assets.length}{" "}
                          {isRtl ? "أصل متاح" : "asset(s) available"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* العمود الجانبي */}
          <div className="space-y-6">
            {/* معلومات المبلّغ */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                  <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("reporterInfo")}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("reporterName")} <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    value={formData.reporterName}
                    onChange={(e) =>
                      setFormData({ ...formData, reporterName: e.target.value })
                    }
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("reporterEmail")} <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    required
                    value={formData.reporterEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, reporterEmail: e.target.value })
                    }
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t("phone")}
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
                  />
                </div>
              </div>
            </div>

            {/* الصورة المرفقة */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                  <ImageIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t("attachedImage") || "الصورة المرفقة"}
                </h3>
              </div>

              <div className="space-y-4">
                {(currentImageUrl || imagePreview) && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 bg-slate-100/50 dark:bg-slate-800/30">
                    <img
                      src={imagePreview || currentImageUrl}
                      alt="Ticket attachment"
                      className="w-full h-auto max-h-48 object-contain"
                    />
                    {!imagePreview && currentImageUrl && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteImage}
                        disabled={deletingImage}
                        className="absolute top-2 right-2 rounded-full h-8 w-8 p-0 bg-rose-500/90 hover:bg-rose-600 transition-colors"
                      >
                        {deletingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full justify-center gap-2 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12 font-medium"
                  >
                    <Upload className="h-4 w-4" />
                    {imageFile ? t("changeImage") : t("uploadImage")}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setImageFile(file);
                    }}
                  />
                  {imageFile && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 text-center">
                      {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* مساعدة سريعة */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
              <Shield className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                {t("editHelpText")}
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
                <X className="h-4 w-4 ml-2" />
                {t("cancel")}
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
                {t("save")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}