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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Calendar, MapPin, FileText, Loader2, Plus, ShieldCheck, Info, Globe,
  Building as BuildingIcon, Layers, DoorOpen, Wrench, Upload
} from "lucide-react";

import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
import type { AssetStatus, AssetType, Building, Floor, Room } from '@/types/assets';

// ✅ التعديل: إضافة roomId كمعامل ثانٍ
const generateSequentialCode = async (typeId: string | null, roomId: string): Promise<string> => {
  const params = new URLSearchParams();
  if (typeId) params.append('typeId', typeId);
  if (roomId) params.append('roomId', roomId);
  const res = await fetch(`/api/assets/next-code?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to generate code');
  const data = await res.json();
  return data.code;
};

export default function NewAssetPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('AssetsForm');
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
    typeId: "",
    statusId: "",
    purchaseDate: "",
    warrantyEnd: "",
    lastMaintenanceDate: "",
    roomId: "",
    notes: "",
  });

  const containerClass = "bg-card border border-border rounded-md p-6 shadow-sm hover:shadow-md transition-all";

  const normalizeBuilding = (b: Building) => ({ ...b, nameEn: b.nameEn ?? undefined });
  const normalizeFloor = (f: Floor) => ({ ...f, nameEn: f.nameEn ?? undefined });
  const normalizeRoom = (r: Room) => ({ ...r, nameEn: r.nameEn ?? undefined });

  // Fetch Data
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
        toast.error(t('fetchError'));
      }
    };
    fetchData();
  }, [locale, t]);

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
          const currentBuilding = buildings.find(b => b.id === buildingId);
          const currentFloor = floors.find(f => f.id === floorId);
          const buildingCode = currentBuilding?.code || '';
          const floorCode = currentFloor?.code || '';

          const roomsWithCode = data.map((room: any) => ({
            id: room.id,
            name: room.name,
            nameEn: room.nameEn ?? undefined,
            floorId: floorId,
            buildingId: buildingId,
            code: room.code || '',
            fullCode: `${buildingCode}-${floorCode}-${room.code || ''}`,
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

  // Handlers
  const handleBuildingChange = (value: string) => {
    setBuildingId(value);
    setFloorId("");
    setRoomId("");
    setFormData(prev => ({ ...prev, roomId: "" }));
    setSelectedRoomFullCode("");
  };

  const handleFloorChange = (value: string) => {
    setFloorId(value);
    setRoomId("");
    setFormData(prev => ({ ...prev, roomId: "" }));
    setSelectedRoomFullCode("");
  };

  const handleRoomChange = (value: string) => {
    setRoomId(value);
    setFormData(prev => ({ ...prev, roomId: value }));
    const selectedRoom = rooms.find(r => r.id === value);
    setSelectedRoomFullCode(selectedRoom?.fullCode || "");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t('nameRequired'));
      return;
    }

    if (!formData.typeId || formData.typeId === "all") {
      toast.error(isRtl ? "يرجى اختيار نوع الأصل" : "Please select an asset type");
      return;
    }

    if (!roomId) {
      toast.error(t('locationRequired'));
      return;
    }

    setLoading(true);
    try {
      // ✅ التعديل: تمرير roomId مع typeId
      const sequentialCode = await generateSequentialCode(formData.typeId || null, roomId);
      const cleanTypeId = formData.typeId && formData.typeId !== "all" ? formData.typeId : null;
      const cleanStatusId = formData.statusId && formData.statusId !== "all" ? formData.statusId : null;

      const payload = {
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim() || null,
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
      try { data = JSON.parse(rawText); } catch (e) { data = { error: rawText }; }

      if (res.ok) {
        toast.success(t('createSuccess'));
        router.push(`/${locale}/assets`);
        router.refresh();
      } else {
        toast.error(data.error || `${t('createError')}: ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(t('createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <DetailHeader
        icon={<Plus size={28} />}
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        actions={
          <Link href={`/${locale}/assets/bulk-import`}>
            <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10 gap-2 font-normal">
              <Upload className="h-4 w-4" />
              {t('bulkImportBtn')}
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <InfoCard title={t('basicInfo')} icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground/70">{t('name')} *</Label>
                  <Input name="name" value={formData.name} onChange={handleChange} placeholder={t('namePlaceholder')} required className="h-14 rounded-2xl border-primary bg-background text-lg px-6" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground/70 flex items-center gap-1"><Globe className="h-4 w-4" /> {t('nameEn')}</Label>
                  <Input name="nameEn" value={formData.nameEn} onChange={handleChange} placeholder={t('nameEnPlaceholder')} className="h-14 rounded-2xl border-primary bg-background text-lg px-6" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* ===== نوع الأصل ===== */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground/70">{t('type')} *</Label>
                    <Select
                      value={formData.typeId}
                      onValueChange={(v) => handleSelectChange("typeId", v)}
                      disabled={types.length === 0}
                    >
                      <SelectTrigger className="w-full h-14 rounded-2xl border-primary bg-background px-6">
                        <SelectValue placeholder={t('selectType')} />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {isRtl ? type.name : (type.nameEn || type.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ===== الحالة ===== */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground/70">{t('status')}</Label>
                    <Select
                      value={formData.statusId}
                      onValueChange={(v) => handleSelectChange("statusId", v)}
                      disabled={statuses.length === 0}
                    >
                      <SelectTrigger className="w-full h-14 rounded-2xl border-primary bg-background px-6">
                        <SelectValue placeholder={t('selectStatus')} />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id.toString()}>
                            {isRtl ? status.name : (status.nameEn || status.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className={containerClass}>
                  <div className="space-y-3">
                    <h3 className="text-foreground font-medium text-lg uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={16} /> {t('locationDetails')} <span className="text-red-500 text-sm">*</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <BuildingSelector value={buildingId} onValueChange={handleBuildingChange} buildings={buildings.map(normalizeBuilding)} loading={buildings.length === 0} placeholder={t('selectBuilding')} emptyMessage={t('noBuildings')} />
                      <FloorSelector value={floorId} onValueChange={handleFloorChange} floors={floors.map(normalizeFloor)} buildingId={buildingId} loading={loadingFloors} placeholder={t('selectFloor')} emptyMessage={t('noFloors')} noBuildingMessage={t('selectBuildingFirst')} />
                      <RoomSelector value={roomId} onValueChange={handleRoomChange} rooms={rooms.map(normalizeRoom)} floorId={floorId} loading={loadingRooms} placeholder={t('selectRoom')} emptyMessage={t('noRooms')} noFloorMessage={t('selectFloorFirst')} />
                    </div>
                    {selectedRoomFullCode && (
                      <div className="mt-5 relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 p-4 shadow-lg">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-30" />
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">{t('selectedRoom')}</span>
                          <span className="text-sm font-mono font-medium text-primary tracking-wider">{selectedRoomFullCode}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </InfoCard>

            <InfoCard title={t('lifecycle')} icon={<ShieldCheck className="h-5 w-5 text-emerald-500/70" />}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground/70">{t('purchaseDate')}</Label>
                  <div className="relative"><Calendar className="absolute right-4 top-4 h-5 w-5 text-muted-foreground/50" /><Input name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} className="h-14 rounded-2xl border-primary bg-background pr-12 w-full" /></div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground/70">{t('warrantyEnd')}</Label>
                  <div className="relative"><ShieldCheck className="absolute right-4 top-4 h-5 w-5 text-emerald-500/70" /><Input name="warrantyEnd" type="date" value={formData.warrantyEnd} onChange={handleChange} className="h-14 rounded-2xl border-primary bg-background pr-12 w-full" /></div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground/70 flex items-center gap-2"><Wrench className="h-4 w-4" /> {t('lastMaintenance')}</Label>
                  <div className="relative"><Calendar className="absolute right-4 top-4 h-5 w-5 text-muted-foreground/50" /><Input name="lastMaintenanceDate" type="date" value={formData.lastMaintenanceDate} onChange={handleChange} className="h-14 rounded-2xl border-primary bg-background pr-12 w-full" /></div>
                  <p className="text-[11px] text-muted-foreground mt-1 italic">{t('lastMaintenanceHint')}</p>
                </div>
              </div>
            </InfoCard>
          </div>

          <div className="space-y-6">
            <InfoCard title={t('notes')} icon={<Info className="h-5 w-5" />}>
              <div className="space-y-4">
                <Textarea name="notes" value={formData.notes} onChange={handleChange} placeholder={t('notesPlaceholder')} className="rounded-2xl border-primary bg-background p-6 resize-none min-h-[120px] w-full" />
                <div className="p-4 bg-primary/5 rounded-2xl flex items-start gap-3 border border-primary/10">
                  <Info className="h-4 w-4 text-primary/70 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium text-primary/70 leading-tight italic">{t('infoText')}</p>
                </div>
              </div>
            </InfoCard>
            <div className="flex gap-3">
              <Button type="button" onClick={() => router.back()} variant="outline" className="flex-1 rounded-full border-primary text-primary hover:bg-primary/10 h-12 font-medium">
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-12">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {t('submit')}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}