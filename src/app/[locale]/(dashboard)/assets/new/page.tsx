"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Calendar, MapPin, FileText, Loader2, Plus, ShieldCheck, Info, Globe, Upload, X, FileUp,
  Building as BuildingIcon, Layers, DoorOpen
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
import Papa from "papaparse";
import type { AssetStatus, AssetType, Building, Floor, Room } from '@/types/assets';

interface BulkAsset {
  name: string;
  typeId: string;
  statusId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  purchaseDate: string;
  warrantyEnd: string;
  notes: string;
}

const generateSequentialCode = async (typeId: string | null): Promise<string> => {
  const params = new URLSearchParams();
  if (typeId) params.append('typeId', typeId);
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
  
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkAssets, setBulkAssets] = useState<BulkAsset[]>([
    { name: "", typeId: "", statusId: "", buildingId: "", floorId: "", roomId: "", purchaseDate: "", warrantyEnd: "", notes: "" },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    typeId: "",
    statusId: "",
    purchaseDate: "",
    warrantyEnd: "",
    roomId: "",
    notes: "",
  });

  const containerClass = "bg-card border border-border rounded-md p-6 shadow-sm hover:shadow-md transition-all";

  const normalizeBuilding = (b: Building) => ({ ...b, nameEn: b.nameEn ?? undefined });
  const normalizeFloor = (f: Floor) => ({ ...f, nameEn: f.nameEn ?? undefined });
  const normalizeRoom = (r: Room) => ({ ...r, nameEn: r.nameEn ?? undefined });

  // --- Fetch Data ---
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
        if (res.ok) {
          const data = await res.json();
          setFloors(data);
        } else {
          setFloors([]);
        }
      } catch (err) {
        console.error(err);
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
      } catch (err) {
        console.error(err);
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    }
    fetchRooms();
  }, [floorId, buildingId, buildings, floors]);

  // --- Handlers ---
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

  const addBulkRow = () => {
    setBulkAssets(prev => [...prev, { name: "", typeId: "", statusId: "", buildingId: "", floorId: "", roomId: "", purchaseDate: "", warrantyEnd: "", notes: "" }]);
  };

  const removeBulkRow = (index: number) => {
    setBulkAssets(prev => prev.filter((_, i) => i !== index));
  };

  const updateBulkAsset = (index: number, field: keyof BulkAsset, value: string) => {
    const updated = [...bulkAssets];
    updated[index][field] = value;
    if (field === 'buildingId') {
      updated[index].floorId = "";
      updated[index].roomId = "";
    }
    if (field === 'floorId') {
      updated[index].roomId = "";
    }
    setBulkAssets(updated);
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data as any[];
        const newAssets: BulkAsset[] = parsed.map((row) => ({
          name: row.name || "",
          typeId: row.typeId || "",
          statusId: row.statusId || "",
          buildingId: row.buildingId || "",
          floorId: row.floorId || "",
          roomId: row.roomId || "",
          purchaseDate: row.purchaseDate || "",
          warrantyEnd: row.warrantyEnd || "",
          notes: row.notes || "",
        }));
        if (newAssets.length) setBulkAssets(newAssets);
        toast.success(t('importSuccess', { count: newAssets.length }));
      },
      error: () => {
        toast.error(t('importError'));
      },
    });
    event.target.value = "";
  };

  const downloadTemplate = () => {
    const headers = ["name", "typeId", "statusId", "buildingId", "floorId", "roomId", "purchaseDate", "warrantyEnd", "notes"];
    const csvContent = headers.join(",") + "\n" + "Example Asset,,,,,,\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "assets_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveBulkAssets = async () => {
    const validAssets = bulkAssets.filter(a => a.name.trim() !== "");
    if (validAssets.length === 0) {
      toast.error(t('noValidAssets'));
      return;
    }
    setBulkLoading(true);
    let successCount = 0;
    let failCount = 0;
    for (const asset of validAssets) {
      try {
        const finalRoomId = asset.roomId || null;
        const sequentialCode = await generateSequentialCode(asset.typeId || null);
        const res = await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: asset.name.trim(),
            nameEn: null,
            code: sequentialCode,
            typeId: asset.typeId || null,
            statusId: asset.statusId || null,
            purchaseDate: asset.purchaseDate || null,
            warrantyEnd: asset.warrantyEnd || null,
            roomId: finalRoomId,
            notes: asset.notes || null,
          }),
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    setBulkLoading(false);
    if (failCount === 0) {
      toast.success(t('bulkSaveSuccess', { successCount }));
      setBulkDialogOpen(false);
      router.push(`/${locale}/assets`);
      router.refresh();
    } else {
      toast.error(t('bulkSavePartial', { successCount, failCount }));
    }
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
    if (!formData.roomId) {
      toast.error(t('locationRequired'));
      return;
    }

    setLoading(true);
    try {
      const sequentialCode = await generateSequentialCode(formData.typeId || null);
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
        roomId: formData.roomId,
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
        console.error("Failed to parse JSON", rawText);
        toast.error(t('serverError'));
        setLoading(false);
        return;
      }

      if (res.ok) {
        toast.success(t('createSuccess'));
        router.push(`/${locale}/assets`);
        router.refresh();
      } else {
        console.error("API Error Details:", data);
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
          <Button 
            variant="outline" 
            className="rounded-full border-primary text-primary hover:bg-primary/10 gap-2"
            onClick={() => setBulkDialogOpen(true)}
          >
            <Upload className="h-4 w-4" />
            {t('bulkImportBtn')}
          </Button>
        }
      />

      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[85vh] overflow-y-auto rounded-2xl bg-card border-border shadow-xl p-0">
          <DialogHeader className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
            <DialogTitle className="text-xl font-black">
              {t('bulkImportTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="flex flex-wrap gap-3 items-center">
              <Button type="button" variant="outline" onClick={downloadTemplate} className="gap-2 rounded-full">
                <FileUp className="h-4 w-4" /> {t('bulkImportTemplate')}
              </Button>
              <label className="cursor-pointer">
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                <Button type="button" variant="secondary" className="gap-2 rounded-full">
                  <Upload className="h-4 w-4" /> {t('bulkUploadCSV')}
                </Button>
              </label>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="whitespace-nowrap">{t('tableName')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('tableType')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('tableStatus')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('tableBuilding')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('tableFloor')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('tableRoom')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('tablePurchaseDate')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('tableWarrantyEnd')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('tableNotes')}</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulkAssets.map((asset, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input 
                            value={asset.name} 
                            onChange={(e) => updateBulkAsset(idx, "name", e.target.value)} 
                            placeholder={t('namePlaceholder')} 
                            className="min-w-[150px]" 
                          />
                        </TableCell>
                        <TableCell>
                          <Select value={asset.typeId} onValueChange={(v) => updateBulkAsset(idx, "typeId", v)}>
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder={t('selectPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              {types.map(t => <SelectItem key={t.id} value={t.id}>{isRtl ? t.name : (t.nameEn || t.name)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={asset.statusId} onValueChange={(v) => updateBulkAsset(idx, "statusId", v)}>
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder={t('selectPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map(s => <SelectItem key={s.id} value={s.id}>{isRtl ? s.name : (s.nameEn || s.name)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={asset.buildingId} onValueChange={(v) => updateBulkAsset(idx, "buildingId", v)}>
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder={t('tableBuilding')} />
                            </SelectTrigger>
                            <SelectContent>
                              {buildings.map(b => <SelectItem key={b.id} value={b.id}>{isRtl ? b.name : (b.nameEn || b.name)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={asset.floorId} onValueChange={(v) => updateBulkAsset(idx, "floorId", v)} disabled={!asset.buildingId}>
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder={t('tableFloor')} />
                            </SelectTrigger>
                            <SelectContent>
                              {floors.filter(f => f.buildingId === asset.buildingId).map(f => <SelectItem key={f.id} value={f.id}>{isRtl ? f.name : (f.nameEn || f.name)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={asset.roomId} onValueChange={(v) => updateBulkAsset(idx, "roomId", v)} disabled={!asset.floorId}>
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder={t('tableRoom')} />
                            </SelectTrigger>
                            <SelectContent>
                              {rooms.filter(r => r.floorId === asset.floorId).map(r => <SelectItem key={r.id} value={r.id}>{isRtl ? r.name : (r.nameEn || r.name)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Input type="date" value={asset.purchaseDate} onChange={(e) => updateBulkAsset(idx, "purchaseDate", e.target.value)} className="w-36" /></TableCell>
                        <TableCell><Input type="date" value={asset.warrantyEnd} onChange={(e) => updateBulkAsset(idx, "warrantyEnd", e.target.value)} className="w-36" /></TableCell>
                        <TableCell><Input value={asset.notes} onChange={(e) => updateBulkAsset(idx, "notes", e.target.value)} placeholder={t('notesPlaceholder')} /></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeBulkRow(idx)} className="text-red-500 hover:text-red-700">
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-4 pt-2">
              <Button type="button" variant="outline" onClick={addBulkRow} className="gap-2 rounded-full">
                <Plus className="h-4 w-4" /> {t('bulkAddRow')}
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setBulkDialogOpen(false)} className="rounded-full">
                  {t('bulkCancel')}
                </Button>
                <Button onClick={saveBulkAssets} disabled={bulkLoading} className="rounded-full bg-primary hover:bg-primary/90">
                  {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('bulkSaveAll')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <form id="main-form" onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <InfoCard title={t('basicInfo')} icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground/70">{t('name')} *</Label>
                  <Input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder={t('namePlaceholder')} 
                    required 
                    className="h-14 rounded-2xl border-primary bg-background focus-visible:ring-2 focus-visible:ring-primary font-bold text-lg px-6 w-full placeholder:text-muted-foreground/50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-black text-muted-foreground/70 flex items-center gap-1">
                    <Globe className="h-4 w-4" /> {t('nameEn')}
                  </Label>
                  <Input 
                    name="nameEn" 
                    value={formData.nameEn} 
                    onChange={handleChange} 
                    placeholder={t('nameEnPlaceholder')} 
                    className="h-14 rounded-2xl border-primary bg-background focus-visible:ring-2 focus-visible:ring-primary font-bold text-lg px-6 w-full placeholder:text-muted-foreground/50" 
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground/70">{t('type')}</Label>
                    <Select value={formData.typeId} onValueChange={(v) => handleSelectChange("typeId", v)} disabled={types.length === 0}>
                      <SelectTrigger className="w-full min-w-[180px] h-14 rounded-2xl border-primary bg-background font-black px-6">
                        {(() => {
                          const selected = types.find(t => t.id === formData.typeId);
                          if (selected) return isRtl ? selected.name : (selected.nameEn || selected.name);
                          if (types.length === 0) return t('loadingTypes');
                          return <SelectValue placeholder={t('selectType')} />;
                        })()}
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {isRtl ? type.name : (type.nameEn || type.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground/70">{t('status')}</Label>
                    <Select value={formData.statusId} onValueChange={(v) => handleSelectChange("statusId", v)} disabled={statuses.length === 0}>
                      <SelectTrigger className="w-full min-w-[180px] h-14 rounded-2xl border-primary bg-background font-black px-6">
                        {(() => {
                          const selected = statuses.find(s => s.id === formData.statusId);
                          if (selected) return isRtl ? selected.name : (selected.nameEn || selected.name);
                          if (statuses.length === 0) return t('loadingStatuses');
                          return <SelectValue placeholder={t('selectStatus')} />;
                        })()}
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {isRtl ? status.name : (status.nameEn || status.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className={containerClass}>
                  <div className="space-y-3">
                    <h3 className="text-foreground font-black text-lg uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={16} /> {t('locationDetails')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground/70 flex items-center gap-1">
                          <BuildingIcon size={12} /> {t('buildingLabel')}
                        </Label>
                        <BuildingSelector
                          value={buildingId}
                          onValueChange={handleBuildingChange}
                          buildings={buildings.map(normalizeBuilding)}
                          loading={buildings.length === 0}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground/70 flex items-center gap-1">
                          <Layers size={12} /> {t('floorLabel')}
                        </Label>
                        <FloorSelector
                          value={floorId}
                          onValueChange={handleFloorChange}
                          floors={floors.map(normalizeFloor)}
                          buildingId={buildingId}
                          loading={loadingFloors}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground/70 flex items-center gap-1">
                          <DoorOpen size={12} /> {t('roomLabel')}
                        </Label>
                        <RoomSelector
                          value={roomId}
                          onValueChange={handleRoomChange}
                          rooms={rooms.map(normalizeRoom)}
                          floorId={floorId}
                          loading={loadingRooms}
                        />
                      </div>
                    </div>
                    {selectedRoomFullCode && (
                      <div className="mt-5 relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 p-4 shadow-lg">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-30" />
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {t('selectedRoom')}
                          </span>
                          <span className="text-sm font-mono font-black text-primary tracking-wider">
                            {(() => {
                              const selectedRoom = rooms.find(r => r.id === roomId);
                              return selectedRoom ? `${selectedRoom.name} — ${selectedRoom.fullCode || selectedRoom.code}` : selectedRoomFullCode;
                            })()}
                          </span>
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
                  <div className="relative">
                    <Calendar className="absolute right-4 top-4 h-5 w-5 text-muted-foreground/50" />
                    <Input 
                      name="purchaseDate" 
                      type="date" 
                      value={formData.purchaseDate} 
                      onChange={handleChange} 
                      className="h-14 rounded-2xl border-primary bg-background pr-12 focus-visible:ring-2 focus-visible:ring-primary font-black w-full" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground/70">{t('warrantyEnd')}</Label>
                  <div className="relative">
                    <ShieldCheck className="absolute right-4 top-4 h-5 w-5 text-emerald-500/70" />
                    <Input 
                      name="warrantyEnd" 
                      type="date" 
                      value={formData.warrantyEnd} 
                      onChange={handleChange} 
                      className="h-14 rounded-2xl border-primary bg-background pr-12 focus-visible:ring-2 focus-visible:ring-emerald-500/50 font-black w-full" 
                    />
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>

          <div className="space-y-6">
            <InfoCard title={t('notes')} icon={<Info className="h-5 w-5" />}>
              <div className="space-y-4">
                <Textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleChange} 
                  placeholder={t('notesPlaceholder')} 
                  className="rounded-2xl border-primary bg-background focus-visible:ring-2 focus-visible:ring-primary font-bold p-6 resize-none leading-relaxed min-h-[120px] w-full" 
                />
                <div className="p-4 bg-primary/5 rounded-2xl flex items-start gap-3 border border-primary/10">
                  <Info className="h-4 w-4 text-primary/70 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-primary/70 leading-tight italic">{t('infoText')}</p>
                </div>
              </div>
            </InfoCard>
            <div className="flex gap-3">
              <Button type="button" onClick={() => router.back()} variant="outline" className="flex-1 rounded-full border-primary text-primary hover:bg-primary/10 h-12 font-black">
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12">
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