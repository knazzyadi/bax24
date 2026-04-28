"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  Info, User, Send, Loader2, Plus, X, Upload,
  MapPin, Building, Layers, DoorOpen, AlertCircle, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { AssetField } from "@/components/shared/form/AssetField";
import { AssetDetailsCard } from "@/components/shared/AssetDetailsCard";

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

interface AssetType { id: string; name: string; code?: string; }
interface Asset { id: string; name: string; code: string; nameEn?: string; }

export default function NewTicketPage() {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations('Tickets');
  const { data: session } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [selectedAssetDetails, setSelectedAssetDetails] = useState<any>(null);
  const [loadingAssetDetails, setLoadingAssetDetails] = useState(false);

  // حالات الموقع الهرمي
  const [buildingId, setBuildingId] = useState<string>("");
  const [floorId, setFloorId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  // الفرع (مطلوب)
  const [branchId, setBranchId] = useState<string>("");

  // بيانات المباني والأدوار والغرف
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

  // container class موحد
  const containerClass = "bg-card border border-border rounded-md p-6 shadow-sm hover:shadow-md transition-all";

  // تعبئة بيانات المبلّغ تلقائياً من الجلسة
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        reporterName: session.user.name || "",
        reporterEmail: session.user.email || "",
      }));
    }
  }, [session]);

  // جلب المباني وأنواع الأصول
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [buildingsRes, assetTypesRes] = await Promise.all([
          fetch("/api/buildings"),
          fetch("/api/asset-types"),
        ]);
        const buildingsData = await buildingsRes.json();
        const typesData = await assetTypesRes.json();
        setBuildings(buildingsData);
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

  // جلب الغرف مع الكود الكامل
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

  // جلب الأصول عند تغيير الغرفة أو نوع الأصل
  useEffect(() => {
    if (!roomId) {
      setAssets([]);
      return;
    }
    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        const params = new URLSearchParams();
        params.append("locationId", roomId);
        if (formData.assetTypeId && formData.assetTypeId !== "all") {
          params.append("typeId", formData.assetTypeId);
        }
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
  }, [roomId, formData.assetTypeId]);

  // جلب تفاصيل الأصل المختار
  useEffect(() => {
    if (!formData.assetId) {
      setSelectedAssetDetails(null);
      return;
    }
    const fetchAssetDetails = async () => {
      setLoadingAssetDetails(true);
      try {
        const res = await fetch(`/api/assets/${formData.assetId}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedAssetDetails(data);
        } else setSelectedAssetDetails(null);
      } catch {
        setSelectedAssetDetails(null);
      } finally {
        setLoadingAssetDetails(false);
      }
    };
    fetchAssetDetails();
  }, [formData.assetId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const imageFiles = selected.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length !== selected.length) {
      toast.warning(t("onlyImagesSupported"));
    }
    setFiles(prev => [...prev, ...imageFiles]);
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const getFullLocation = (room: any, isRtl: boolean): string => {
    if (!room) return isRtl ? "موقع غير محدد" : "Location not set";
    const floor = room.floor;
    const building = floor?.building;
    const buildingName = building ? (isRtl ? building.name : building.nameEn || building.name) : "";
    const floorName = floor ? (isRtl ? floor.name : floor.nameEn || floor.name) : "";
    const roomName = isRtl ? room.name : room.nameEn || room.name;
    return [buildingName, floorName, roomName].filter(p => p).join(" - ");
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
    files.forEach(file => payload.append("images", file));

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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const ticketTypeMap: Record<string, string> = {
    MAINTENANCE: isRtl ? "بلاغ صيانة" : "Maintenance Ticket",
    INCIDENT: isRtl ? "بلاغ حادث" : "Incident Ticket",
  };

  return (
    <FormPageContainer
      icon={<FileText size={28} />}
      title={isRtl ? "إنشاء بلاغ جديد" : "New Ticket"}
      subtitle={isRtl ? "أدخل تفاصيل البلاغ وارفع الصور (اختياري)" : "Enter ticket details and upload images (optional)"}
    >
      <div className="lg:col-span-2 space-y-8">
        {/* تفاصيل البلاغ */}
        <FormSection icon={<AlertCircle size={16} />} title={isRtl ? "تفاصيل البلاغ" : "Ticket Details"}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-black text-muted-foreground">
                {isRtl ? "نوع البلاغ *" : "Ticket Type *"}
              </Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                <SelectTrigger className="h-14 rounded-2xl border-primary bg-background font-black px-6">
                  {ticketTypeMap[formData.type] || (isRtl ? "اختر نوع البلاغ" : "Select ticket type")}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAINTENANCE">{ticketTypeMap.MAINTENANCE}</SelectItem>
                  <SelectItem value="INCIDENT">{ticketTypeMap.INCIDENT}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-black text-muted-foreground">{isRtl ? "العنوان *" : "Title *"}</Label>
              <Input
                required
                placeholder={isRtl ? "مثال: عطل في التكييف..." : "e.g., AC malfunction..."}
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="h-14 rounded-2xl border-primary bg-background font-bold text-lg px-6"
              />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label className="text-sm font-black text-muted-foreground">{isRtl ? "الوصف *" : "Description *"}</Label>
            <Textarea
              required
              placeholder={isRtl ? "يرجى كتابة التفاصيل..." : "Please provide details..."}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="rounded-2xl border-primary bg-background font-bold p-6 min-h-[120px]"
            />
          </div>
        </FormSection>

        {/* الموقع الهرمي مع containerClass وتسميات معدلة */}
        <div className={containerClass}>
          <div className="space-y-3">
            <h3 className="text-foreground font-black text-lg uppercase tracking-widest flex items-center gap-2">
              <MapPin size={16} /> {isRtl ? 'تفاصيل الموقع' : 'Location Details'}
              <span className="text-red-500 text-sm">*</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground/70 flex items-center gap-1">
                  <Building size={12} /> {isRtl ? "المبنى أو المنطقة" : "Building / Zone"}
                </Label>
                <BuildingSelector
                  value={buildingId}
                  onValueChange={(val) => { setBuildingId(val); setFloorId(""); setRoomId(""); }}
                  buildings={buildings}
                  loading={loadingBuildings}
                />
              </div>
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
            </div>
            {roomId && (() => {
              const selectedRoom = rooms.find(r => r.id === roomId);
              if (!selectedRoom) return null;
              return (
                <div className="mt-5 relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 p-4 shadow-lg">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-30" />
                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {isRtl ? "الوحدة المختارة" : "Selected Unit"}
                    </span>
                    <span className="text-sm font-mono font-black text-primary tracking-wider">
                      {selectedRoom.name} {selectedRoom.fullCode && `(${selectedRoom.fullCode})`}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* حاوية الأصل */}
        <div className={containerClass}>
          <h3 className="text-foreground font-black text-lg uppercase tracking-widest flex items-center gap-2">
            <FileText size={16} /> {isRtl ? 'بيانات الأصل (اختياري)' : 'Asset Details (Optional)'}
          </h3>
          <div className="space-y-4 mt-3">
            <AssetTypeField
              value={formData.assetTypeId}
              onChange={(val) => setFormData(prev => ({ ...prev, assetTypeId: val ?? "", assetId: "" }))}
              assetTypes={assetTypes}
              disabled={!roomId}
              placeholder={roomId ? (isRtl ? "اختر نوع الأصل" : "Select asset type") : (isRtl ? "اختر الموقع أولاً" : "Select location first")}
            />
            <AssetField
              value={formData.assetId}
              onChange={(val) => setFormData(prev => ({ ...prev, assetId: val ?? "" }))}
              assets={assets}
              loading={loadingAssets}
              disabled={!roomId}
              placeholder={roomId ? (isRtl ? "اختر الأصل" : "Select asset") : (isRtl ? "اختر الموقع أولاً" : "Select location first")}
              noAssetsMessage={isRtl ? "لا توجد أصول في هذا الموقع" : "No assets at this location"}
            />

            {/* ✅ بطاقة الأصل المختار (بنفس تصميم الغرفة) */}
            {formData.assetId && (() => {
              const selectedAsset = assets.find(a => a.id === formData.assetId);
              if (!selectedAsset) return null;
              return (
                <div className="mt-5 relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 p-4 shadow-lg">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-30" />
                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {isRtl ? "الأصل المختار" : "Selected Asset"}
                    </span>
                    <span className="text-sm font-mono font-black text-primary tracking-wider">
                      {selectedAsset.name} ({selectedAsset.code})
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* العمود الجانبي */}
      <div className="space-y-8">
        <FormSidebar>
          <div className="space-y-4">
            <h3 className="text-foreground font-black text-md uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> {isRtl ? "بيانات المبلّغ" : "Reporter Info"}
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-bold text-muted-foreground">{isRtl ? "الاسم *" : "Name *"}</Label>
                <Input
                  required
                  value={formData.reporterName}
                  onChange={e => setFormData({...formData, reporterName: e.target.value})}
                  className="h-12 rounded-md bg-muted border-border"
                />
              </div>
              <div>
                <Label className="text-sm font-bold text-muted-foreground">{isRtl ? "البريد الإلكتروني *" : "Email *"}</Label>
                <Input
                  type="email"
                  required
                  value={formData.reporterEmail}
                  onChange={e => setFormData({...formData, reporterEmail: e.target.value})}
                  className="h-12 rounded-md bg-muted border-border"
                />
              </div>
              <div>
                <Label className="text-sm font-bold text-muted-foreground">{isRtl ? "رقم التواصل (اختياري)" : "Phone (Optional)"}</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="h-12 rounded-md bg-muted border-border"
                />
              </div>
            </div>
          </div>

          {/* الفرع (Branch) */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Building size={14} /> {isRtl ? "الفرع *" : "Branch *"}
            </Label>
            <BranchSelector value={branchId} onValueChange={setBranchId} />
            <p className="text-[11px] text-muted-foreground">
              {isRtl ? "الفرع الذي سيتم توجيه البلاغ إليه." : "The branch to which the ticket will be routed."}
            </p>
          </div>

          {/* رفع الصور */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Upload size={14} /> {isRtl ? "رفع صور (اختياري)" : "Upload Images (Optional)"}
            </Label>
            <Input type="file" accept="image/*" multiple onChange={handleFileChange} className="cursor-pointer" />
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <img src={src} alt={`preview-${idx}`} className="w-full h-24 object-cover rounded-lg border border-primary/30" />
                    <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              {isRtl ? "يمكنك رفع عدة صور بصيغة JPG, PNG, GIF" : "You can upload multiple images (JPG, PNG, GIF)"}
            </p>
          </div>

          <div className="pt-4 border-t border-border flex gap-3">
            <Button onClick={() => router.back()} variant="outline" className="flex-1 h-11 rounded-full border-red-500 text-red-500 hover:bg-red-50 font-black">
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 h-11 rounded-full bg-primary hover:bg-primary/90 font-black gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
              {isRtl ? "إرسال البلاغ" : "Submit"}
            </Button>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/30 text-xs font-bold text-muted-foreground flex gap-2">
            <Info size={14} className="text-primary shrink-0" />
            {isRtl
              ? "سيتم إنشاء طلب عمل تلقائياً بعد قبول البلاغ."
              : "A work order will be created automatically upon approval."}
          </div>
        </FormSidebar>
      </div>
    </FormPageContainer>
  );
}