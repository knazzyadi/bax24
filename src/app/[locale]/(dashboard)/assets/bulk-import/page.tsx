// src/app/[locale]/(dashboard)/assets/bulk-import/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, X, Upload, FileUp, Loader2, ArrowLeft } from "lucide-react";
import Papa from "papaparse";
import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import type { AssetStatus, AssetType, Building, Floor, Room } from "@/types/assets";

interface BulkAsset {
  name: string;
  typeId: string;
  statusId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  purchaseDate: string;
  warrantyEnd: string;
  lastMaintenanceDate: string;
  notes: string;
}

const generateSequentialCode = async (typeId: string | null): Promise<string> => {
  const params = new URLSearchParams();
  if (typeId) params.append("typeId", typeId);
  const res = await fetch(`/api/assets/next-code?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to generate code");
  const data = await res.json();
  return data.code;
};

export default function BulkImportAssetsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("AssetsForm");
  const isRtl = locale === "ar";

  const [statuses, setStatuses] = useState<AssetStatus[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bulkAssets, setBulkAssets] = useState<BulkAsset[]>([
    { name: "", typeId: "", statusId: "", buildingId: "", floorId: "", roomId: "", purchaseDate: "", warrantyEnd: "", lastMaintenanceDate: "", notes: "" },
  ]);

  const [bulkLoading, setBulkLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // جلب البيانات الأساسية
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
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchData();
  }, [locale, t]);

  // تحميل الأدوار والغرف بناءً على المبنى المختار (لصف معين)
  const loadFloorsForBuilding = async (buildingId: string) => {
    if (!buildingId) return [];
    try {
      const res = await fetch(`/api/buildings/${buildingId}/floors`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  };

  const loadRoomsForFloor = async (floorId: string) => {
    if (!floorId) return [];
    try {
      const res = await fetch(`/api/floors/${floorId}/rooms`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  };

  const updateBulkAsset = (index: number, field: keyof BulkAsset, value: string) => {
    const updated = [...bulkAssets];
    updated[index][field] = value;
    if (field === "buildingId") {
      updated[index].floorId = "";
      updated[index].roomId = "";
    }
    if (field === "floorId") {
      updated[index].roomId = "";
    }
    setBulkAssets(updated);
  };

  const addBulkRow = () => {
    setBulkAssets(prev => [
      ...prev,
      { name: "", typeId: "", statusId: "", buildingId: "", floorId: "", roomId: "", purchaseDate: "", warrantyEnd: "", lastMaintenanceDate: "", notes: "" },
    ]);
  };

  const removeBulkRow = (index: number) => {
    if (bulkAssets.length === 1) {
      toast.info(isRtl ? "لا يمكن حذف الصف الوحيد" : "Cannot remove the only row");
      return;
    }
    setBulkAssets(prev => prev.filter((_, i) => i !== index));
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
          lastMaintenanceDate: row.lastMaintenanceDate || "",
          notes: row.notes || "",
        }));
        if (newAssets.length) setBulkAssets(newAssets);
        toast.success(t("importSuccess", { count: newAssets.length }));
      },
      error: () => toast.error(t("importError")),
    });
    event.target.value = "";
  };

  const downloadTemplate = () => {
    const headers = ["name", "typeId", "statusId", "buildingId", "floorId", "roomId", "purchaseDate", "warrantyEnd", "lastMaintenanceDate", "notes"];
    const csvContent = headers.join(",") + "\n" + "Example Asset,,,,,,,,,\n";
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
      toast.error(t("noValidAssets"));
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
            lastMaintenanceDate: asset.lastMaintenanceDate || null,
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
      toast.success(t("bulkSaveSuccess", { successCount }));
      router.push(`/${locale}/assets`);
      router.refresh();
    } else {
      toast.error(t("bulkSavePartial", { successCount, failCount }));
    }
  };

  const getFloorsForBuilding = (buildingId?: string) => {
    if (!buildingId) return [];
    return floors.filter(f => f.buildingId === buildingId);
  };

  const getRoomsForFloor = (floorId?: string) => {
    if (!floorId) return [];
    return rooms.filter(r => r.floorId === floorId);
  };

  // تحميل القوائم عند تغيير المبنى/الدور (نتمكن من جلبها لكل صف)
  // للتبسيط، سنقوم بجلب كل الأدوار والغرف أولا (تحميل مسبق)
  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        const [floorsRes, roomsRes] = await Promise.all([
          fetch("/api/floors"),
          fetch("/api/rooms"),
        ]);
        if (floorsRes.ok) setFloors(await floorsRes.json());
        if (roomsRes.ok) setRooms(await roomsRes.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchHierarchy();
  }, []);

  return (
    <PageContainer>
      <DetailHeader
        icon={<Upload size={28} />}
        title={t("bulkImportTitle")}
        subtitle={t("bulkImportSubtitle")}
        actions={
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-full border-primary text-primary hover:bg-primary/10 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back")}
          </Button>
        }
      />

      <div className="space-y-6">
        <InfoCard title={t("bulkImportActions")} icon={<FileUp className="h-5 w-5" />}>
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="outline" onClick={downloadTemplate} className="gap-2 rounded-full">
              <FileUp className="h-4 w-4" /> {t("bulkImportTemplate")}
            </Button>
            <label className="cursor-pointer">
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              <Button variant="secondary" className="gap-2 rounded-full">
                <Upload className="h-4 w-4" /> {t("bulkUploadCSV")}
              </Button>
            </label>
            <Button variant="default" onClick={addBulkRow} className="gap-2 rounded-full">
              <Plus className="h-4 w-4" /> {t("bulkAddRow")}
            </Button>
          </div>
        </InfoCard>

        <div className="border rounded-xl overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="whitespace-nowrap">{t("tableName")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("tableType")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("tableStatus")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("tableBuilding")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("tableFloor")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("tableRoom")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("tablePurchaseDate")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("tableWarrantyEnd")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("tableLastMaintenance")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("tableNotes")}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkAssets.map((asset, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Input value={asset.name} onChange={(e) => updateBulkAsset(idx, "name", e.target.value)} placeholder={t("namePlaceholder")} className="min-w-[150px]" /></TableCell>
                    <TableCell>
                      <Select value={asset.typeId} onValueChange={(v) => updateBulkAsset(idx, "typeId", v)}>
                        <SelectTrigger className="w-36"><SelectValue placeholder={t("selectPlaceholder")} /></SelectTrigger>
                        <SelectContent>
                          {types.map(t => <SelectItem key={t.id} value={t.id}>{isRtl ? t.name : (t.nameEn || t.name)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={asset.statusId} onValueChange={(v) => updateBulkAsset(idx, "statusId", v)}>
                        <SelectTrigger className="w-36"><SelectValue placeholder={t("selectPlaceholder")} /></SelectTrigger>
                        <SelectContent>
                          {statuses.map(s => <SelectItem key={s.id} value={s.id}>{isRtl ? s.name : (s.nameEn || s.name)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={asset.buildingId} onValueChange={(v) => updateBulkAsset(idx, "buildingId", v)}>
                        <SelectTrigger className="w-36"><SelectValue placeholder={t("tableBuilding")} /></SelectTrigger>
                        <SelectContent>
                          {buildings.map(b => <SelectItem key={b.id} value={b.id}>{isRtl ? b.name : (b.nameEn || b.name)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={asset.floorId} onValueChange={(v) => updateBulkAsset(idx, "floorId", v)} disabled={!asset.buildingId}>
                        <SelectTrigger className="w-36"><SelectValue placeholder={t("tableFloor")} /></SelectTrigger>
                        <SelectContent>
                          {getFloorsForBuilding(asset.buildingId).map(f => <SelectItem key={f.id} value={f.id}>{isRtl ? f.name : (f.nameEn || f.name)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={asset.roomId} onValueChange={(v) => updateBulkAsset(idx, "roomId", v)} disabled={!asset.floorId}>
                        <SelectTrigger className="w-36"><SelectValue placeholder={t("tableRoom")} /></SelectTrigger>
                        <SelectContent>
                          {getRoomsForFloor(asset.floorId).map(r => <SelectItem key={r.id} value={r.id}>{isRtl ? r.name : (r.nameEn || r.name)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Input type="date" value={asset.purchaseDate} onChange={(e) => updateBulkAsset(idx, "purchaseDate", e.target.value)} className="w-36" /></TableCell>
                    <TableCell><Input type="date" value={asset.warrantyEnd} onChange={(e) => updateBulkAsset(idx, "warrantyEnd", e.target.value)} className="w-36" /></TableCell>
                    <TableCell><Input type="date" value={asset.lastMaintenanceDate} onChange={(e) => updateBulkAsset(idx, "lastMaintenanceDate", e.target.value)} className="w-36" /></TableCell>
                    <TableCell><Input value={asset.notes} onChange={(e) => updateBulkAsset(idx, "notes", e.target.value)} placeholder={t("notesPlaceholder")} /></TableCell>
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

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => router.back()}>{t("cancel")}</Button>
          <Button onClick={saveBulkAssets} disabled={bulkLoading} className="bg-primary hover:bg-primary/90">
            {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
            {t("bulkSaveAll")}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}