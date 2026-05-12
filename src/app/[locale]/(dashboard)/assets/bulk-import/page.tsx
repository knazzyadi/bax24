// src/app/[locale]/(dashboard)/assets/bulk-import/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter }from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Plus, Trash2, Upload, FileUp, Loader2, Calendar, Wrench, ShieldCheck, 
  Building as BuildingIcon, Layers, DoorOpen, Save, X, Info, FileText, Globe
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Papa from "papaparse";
import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { BuildingSelector } from "@/components/shared/BuildingSelector";
import { FloorSelector } from "@/components/shared/FloorSelector";
import { RoomSelector } from "@/components/shared/RoomSelector";
import type { AssetStatus, AssetType, Building, Floor, Room } from '@/types/assets';

interface BulkAssetRow {
  id: string;
  name: string;
  nameEn: string;        // ✅ إضافة حقل الاسم بالإنجليزية
  purchaseDate: string;
  warrantyEnd: string;
  lastMaintenanceDate: string;
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

export default function BulkImportAssetsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('AssetsForm');
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<AssetStatus[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);
  
  const [commonTypeId, setCommonTypeId] = useState<string>("");
  const [commonStatusId, setCommonStatusId] = useState<string>("");
  const [commonBuildingId, setCommonBuildingId] = useState<string>("");
  const [commonFloorId, setCommonFloorId] = useState<string>("");
  const [commonRoomId, setCommonRoomId] = useState<string>("");
  const [commonRoomFullCode, setCommonRoomFullCode] = useState<string>("");
  const [commonRoomName, setCommonRoomName] = useState<string>("");

  const [rows, setRows] = useState<BulkAssetRow[]>([
    { id: crypto.randomUUID(), name: "", nameEn: "", purchaseDate: "", warrantyEnd: "", lastMaintenanceDate: "", notes: "" }
  ]);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const normalizeBuilding = (b: Building) => ({ ...b, nameEn: b.nameEn ?? undefined });
  const normalizeFloor = (f: Floor) => ({ ...f, nameEn: f.nameEn ?? undefined });
  const normalizeRoom = (r: Room) => ({ ...r, nameEn: r.nameEn ?? undefined });

  const getTypeName = (typeId: string) => {
    if (!typeId) return t('selectType');
    const type = types.find(t => t.id === typeId);
    return type ? (isRtl ? type.name : (type.nameEn || type.name)) : t('selectType');
  };

  const getStatusName = (statusId: string) => {
    if (!statusId) return t('selectStatus');
    const status = statuses.find(s => s.id === statusId);
    return status ? (isRtl ? status.name : (status.nameEn || status.name)) : t('selectStatus');
  };

  // Fetch data
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
    if (!commonBuildingId) {
      setFloors([]);
      return;
    }
    async function fetchFloors() {
      setLoadingFloors(true);
      try {
        const res = await fetch(`/api/buildings/${commonBuildingId}/floors`);
        if (res.ok) setFloors(await res.json());
        else setFloors([]);
      } catch {
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    }
    fetchFloors();
  }, [commonBuildingId]);

  useEffect(() => {
    if (!commonFloorId) {
      setRooms([]);
      setCommonRoomFullCode("");
      setCommonRoomName("");
      return;
    }
    async function fetchRooms() {
      setLoadingRooms(true);
      try {
        const res = await fetch(`/api/floors/${commonFloorId}/rooms`);
        if (res.ok) {
          const data = await res.json();
          const currentBuilding = buildings.find(b => b.id === commonBuildingId);
          const currentFloor = floors.find(f => f.id === commonFloorId);
          const buildingCode = currentBuilding?.code || '';
          const floorCode = currentFloor?.code || '';

          const roomsWithCode = data.map((room: any) => ({
            id: room.id,
            name: room.name,
            nameEn: room.nameEn ?? undefined,
            floorId: commonFloorId,
            buildingId: commonBuildingId,
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
  }, [commonFloorId, commonBuildingId, buildings, floors]);

  const handleBuildingChange = (value: string) => {
    setCommonBuildingId(value);
    setCommonFloorId("");
    setCommonRoomId("");
    setCommonRoomFullCode("");
    setCommonRoomName("");
  };

  const handleFloorChange = (value: string) => {
    setCommonFloorId(value);
    setCommonRoomId("");
    setCommonRoomFullCode("");
    setCommonRoomName("");
  };

  const handleRoomChange = (value: string) => {
    setCommonRoomId(value);
    const selectedRoom = rooms.find(r => r.id === value);
    setCommonRoomFullCode(selectedRoom?.fullCode || "");
    setCommonRoomName(selectedRoom ? (isRtl ? selectedRoom.name : selectedRoom.nameEn || selectedRoom.name) : "");
  };

  const addRow = () => {
    setRows(prev => [...prev, { id: crypto.randomUUID(), name: "", nameEn: "", purchaseDate: "", warrantyEnd: "", lastMaintenanceDate: "", notes: "" }]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) {
      toast.warning(isRtl ? "لا يمكن حذف الصف الوحيد" : "Cannot delete the only row");
      return;
    }
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof BulkAssetRow, value: string) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data as any[];
        const newRows: BulkAssetRow[] = parsed.map((row, idx) => ({
          id: crypto.randomUUID(),
          name: row.name || "",
          nameEn: row.nameEn || "",
          purchaseDate: row.purchaseDate || "",
          warrantyEnd: row.warrantyEnd || "",
          lastMaintenanceDate: row.lastMaintenanceDate || "",
          notes: row.notes || "",
        })).filter(row => row.name.trim() !== "");
        if (newRows.length) setRows(newRows);
        toast.success(t('importSuccess', { count: newRows.length }));
      },
      error: () => {
        toast.error(t('importError'));
      },
    });
    event.target.value = "";
  };

  const downloadTemplate = () => {
    const headers = ["name", "nameEn", "purchaseDate", "warrantyEnd", "lastMaintenanceDate", "notes"];
    const csvContent = headers.join(",") + "\n" + "Example Asset,Example Asset EN,2025-01-01,2026-01-01,2025-06-01,Some notes\n";
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

  const validateRows = () => {
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].name.trim()) {
        toast.error(isRtl ? `الصف ${i+1}: اسم الأصل مطلوب` : `Row ${i+1}: Asset name is required`);
        return false;
      }
    }
    if (!commonTypeId) {
      toast.error(isRtl ? "يرجى اختيار نوع الأصل" : "Please select asset type");
      return false;
    }
    if (!commonRoomId) {
      toast.error(isRtl ? "يرجى اختيار الغرفة (الموقع)" : "Please select room");
      return false;
    }
    return true;
  };

  const saveAll = async () => {
    if (!validateRows()) return;
    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of rows) {
      try {
        const code = await generateSequentialCode(commonTypeId);
        const payload = {
          name: row.name.trim(),
          nameEn: row.nameEn.trim() || null,
          code,
          typeId: commonTypeId,
          statusId: commonStatusId || null,
          purchaseDate: row.purchaseDate || null,
          warrantyEnd: row.warrantyEnd || null,
          lastMaintenanceDate: row.lastMaintenanceDate || null,
          roomId: commonRoomId,
          notes: row.notes || null,
        };
        const res = await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    setLoading(false);
    if (failCount === 0) {
      toast.success(t('bulkSaveSuccess', { successCount }));
      router.push(`/${locale}/assets`);
      router.refresh();
    } else {
      toast.error(t('bulkSavePartial', { successCount, failCount }));
    }
  };

  const commonFieldsValid = commonTypeId && commonRoomId;

  return (
    <PageContainer>
      <DetailHeader
        icon={<Upload size={28} />}
        title={t('bulkImportTitle')}
        subtitle={isRtl ? "إضافة مجموعة من الأصول مرة واحدة" : "Add multiple assets at once"}
        actions={
          <Button variant="outline" onClick={() => router.back()} className="rounded-full border-primary text-primary hover:bg-primary/10 gap-2">
            <X className="h-4 w-4" />
            {t('back')}
          </Button>
        }
      />

      <div className="space-y-8">
        {/* Common fields card */}
        <InfoCard title={isRtl ? "القيم المشتركة لجميع الأصول" : "Common values for all assets"} icon={<FileText className="h-5 w-5" />}>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>{t('type')} *</Label>
                <Select value={commonTypeId} onValueChange={setCommonTypeId}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <span>{getTypeName(commonTypeId)}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {types.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {isRtl ? t.name : (t.nameEn || t.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('status')}</Label>
                <Select value={commonStatusId} onValueChange={setCommonStatusId}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <span>{getStatusName(commonStatusId)}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {isRtl ? s.name : (s.nameEn || s.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('location')} *</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <BuildingSelector
                  value={commonBuildingId}
                  onValueChange={handleBuildingChange}
                  buildings={buildings.map(normalizeBuilding)}
                  loading={buildings.length === 0}
                  placeholder={t('selectBuilding')}
                  emptyMessage={t('noBuildings')}
                />
                <FloorSelector
                  value={commonFloorId}
                  onValueChange={handleFloorChange}
                  floors={floors.map(normalizeFloor)}
                  buildingId={commonBuildingId}
                  loading={loadingFloors}
                  placeholder={t('selectFloor')}
                  emptyMessage={t('noFloors')}
                  noBuildingMessage={t('selectBuildingFirst')}
                />
                <RoomSelector
                  value={commonRoomId}
                  onValueChange={handleRoomChange}
                  rooms={rooms.map(normalizeRoom)}
                  floorId={commonFloorId}
                  loading={loadingRooms}
                  placeholder={t('selectRoom')}
                  emptyMessage={t('noRooms')}
                  noFloorMessage={t('selectFloorFirst')}
                />
              </div>
              {commonRoomFullCode && (
                <div className="mt-2 text-sm text-primary font-mono">
                  {commonRoomName} — {commonRoomFullCode}
                </div>
              )}
            </div>
          </div>
        </InfoCard>

        {/* Dynamic table card */}
        <InfoCard title={isRtl ? "قائمة الأصول" : "Asset List"} icon={<Table className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="flex gap-2">
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
              <Button type="button" onClick={addRow} variant="outline" className="gap-2 rounded-full">
                <Plus className="h-4 w-4" /> {t('addRow')}
              </Button>
            </div>

            <div className="border rounded-xl overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="min-w-[180px]">{t('tableName')} *</TableHead>
                    <TableHead className="min-w-[180px]">{t('nameEn')}</TableHead>
                    <TableHead className="min-w-[140px]">{t('tablePurchaseDate')}</TableHead>
                    <TableHead className="min-w-[140px]">{t('tableWarrantyEnd')}</TableHead>
                    <TableHead className="min-w-[140px]">{t('lastMaintenance')}</TableHead>
                    <TableHead className="min-w-[200px]">{t('tableNotes')}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Input
                          value={row.name}
                          onChange={(e) => updateRow(idx, "name", e.target.value)}
                          placeholder={t('namePlaceholder')}
                          className="min-w-[160px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.nameEn}
                          onChange={(e) => updateRow(idx, "nameEn", e.target.value)}
                          placeholder={t('nameEnPlaceholder')}
                          className="min-w-[160px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input type="date" value={row.purchaseDate} onChange={(e) => updateRow(idx, "purchaseDate", e.target.value)} className="w-36" />
                      </TableCell>
                      <TableCell>
                        <Input type="date" value={row.warrantyEnd} onChange={(e) => updateRow(idx, "warrantyEnd", e.target.value)} className="w-36" />
                      </TableCell>
                      <TableCell>
                        <Input type="date" value={row.lastMaintenanceDate} onChange={(e) => updateRow(idx, "lastMaintenanceDate", e.target.value)} className="w-36" />
                      </TableCell>
                      <TableCell>
                        <Input value={row.notes} onChange={(e) => updateRow(idx, "notes", e.target.value)} placeholder={t('notesPlaceholder')} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeRow(idx)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-full px-6">
                {t('cancel')}
              </Button>
              <Button onClick={saveAll} disabled={loading || !commonFieldsValid} className="rounded-full bg-primary hover:bg-primary/90 px-6">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('bulkSaveAll')}
              </Button>
            </div>
          </div>
        </InfoCard>
      </div>
    </PageContainer>
  );
}