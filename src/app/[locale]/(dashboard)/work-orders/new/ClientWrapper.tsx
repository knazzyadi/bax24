// src/app/[locale]/(dashboard)/work-orders/new/ClientWrapper.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Wrench,
  Loader2,
  Save,
  X,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { BasicInfoCard } from "../BasicInfoCard";
import { LocationCard } from "../LocationCard";
import { InfoBar } from "../InfoBar";
import { NotesEditor } from "../NotesEditor";
import { GuidelinesCard } from "../GuidelinesCard";
import { AttachmentsCard } from "../AttachmentsCard";
import { glassCard } from "../constants";
import type { WorkOrderFormData } from "../types";

// ============================================================
// الأنواع
// ============================================================

interface Priority {
  id: string;
  name: string;
  nameEn?: string;
  color?: string;
}

interface Status {
  id: string;
  name: string;
  nameEn?: string;
  color?: string;
}

interface AssetType {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

interface Building {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

interface WorkOrderType {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

interface NewWorkOrderClientProps {
  locale: string;
  session: any;
  initialPriorities: Priority[];
  initialStatuses: Status[];
  initialAssetTypes: AssetType[];
  initialBuildings: Building[];
  initialWorkOrderTypes: WorkOrderType[];
  initialSource: "manual" | "ticket" | "pm" | "checklist";
  initialSourceId: string | null;
  isSourceEditable: boolean;
}

// ============================================================
// المكون الرئيسي
// ============================================================

export function NewWorkOrderClient({
  locale,
  session,
  initialPriorities,
  initialStatuses,
  initialAssetTypes,
  initialBuildings,
  initialWorkOrderTypes,
  initialSource,
  initialSourceId,
  isSourceEditable,
}: NewWorkOrderClientProps) {
  const router = useRouter();
  const isRtl = locale === "ar";
  const t = useTranslations("WorkOrdersForm");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const defaultWorkOrderTypeId =
    initialWorkOrderTypes.length > 0 ? initialWorkOrderTypes[0].id : "";
  const defaultPriorityId =
    initialPriorities.length > 0 ? initialPriorities[0].id : "";
  const defaultStatusId =
    initialStatuses.length > 0 ? initialStatuses[0].id : "";

  // ✅ استخدام النوع الأصلي مباشرة (بدون إضافة type)
  const [formData, setFormData] = useState<WorkOrderFormData>({
    title: "",
    description: "",
    workOrderTypeId: defaultWorkOrderTypeId,
    source: initialSource,
    priorityId: defaultPriorityId,
    statusId: defaultStatusId,
    assetTypeId: "",
    category: undefined,
    reason: "",
    notes: "",
    branchId: "",
    buildingId: "",
    floorId: "",
    roomId: "",
    assetIds: [],
    assignedTo: [],
    sourceId: initialSourceId,
  });

  const [locationLevel, setLocationLevel] = useState<
    "building" | "floor" | "room"
  >("room");

  const [buildings] = useState<Building[]>(initialBuildings);
  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [tempSelectedAssetIds, setTempSelectedAssetIds] = useState<string[]>(
    []
  );

  const currentUser = session?.user?.name || "Unknown";
  const currentDate = new Date().toLocaleString(
    isRtl ? "ar-SA" : "en-US",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  // ============================================================
  // جلب الأدوار (Floors)
  // ============================================================

  useEffect(() => {
    if (!formData.buildingId) {
      setFloors([]);
      return;
    }
    async function fetchFloors() {
      setLoadingFloors(true);
      try {
        const res = await fetch(
          `/api/buildings/${formData.buildingId}/floors`
        );
        if (res.ok) {
          const data = await res.json();
          setFloors(data);
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
  }, [formData.buildingId]);

  // ============================================================
  // جلب الغرف (Rooms)
  // ============================================================

  useEffect(() => {
    if (!formData.floorId) {
      setRooms([]);
      return;
    }
    async function fetchRooms() {
      setLoadingRooms(true);
      try {
        const res = await fetch(
          `/api/floors/${formData.floorId}/rooms`
        );
        if (res.ok) {
          const data = await res.json();
          const currentBuilding = buildings.find(
            (b) => b.id === formData.buildingId
          );
          const currentFloor = floors.find(
            (f) => f.id === formData.floorId
          );
          const buildingCode = currentBuilding?.code || "";
          const floorCode = currentFloor?.code || "";
          const roomsWithCode = data.map((room: any) => ({
            id: room.id,
            name: room.name,
            nameEn: room.nameEn,
            code: room.code,
            floorId: formData.floorId,
            buildingId: formData.buildingId,
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
  }, [formData.floorId, formData.buildingId, buildings, floors]);

  // ============================================================
  // جلب الأصول (Assets)
  // ============================================================

  useEffect(() => {
    const hasAssetType = formData.assetTypeId && formData.assetTypeId !== "";
    if (!hasAssetType) {
      setAssets([]);
      return;
    }

    let canFetch = false;
    const params = new URLSearchParams();
    if (formData.assetTypeId) {
      params.append("typeId", formData.assetTypeId);
    }
    if (formData.branchId) {
      params.append("branchId", formData.branchId);
    }

    if (locationLevel === "room" && formData.roomId) {
      params.append("roomId", formData.roomId);
      canFetch = true;
    } else if (locationLevel === "floor" && formData.floorId) {
      params.append("floorId", formData.floorId);
      canFetch = true;
    } else if (locationLevel === "building" && formData.buildingId) {
      params.append("buildingId", formData.buildingId);
      canFetch = true;
    }

    if (!canFetch) {
      setAssets([]);
      return;
    }

    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        const res = await fetch(`/api/assets?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          let fetchedAssets: any[] = [];
          if (Array.isArray(data.assets)) {
            fetchedAssets = data.assets;
          } else if (Array.isArray(data.data)) {
            fetchedAssets = data.data;
          } else if (Array.isArray(data)) {
            fetchedAssets = data;
          } else {
            console.warn("Unexpected assets response structure:", data);
            fetchedAssets = [];
          }
          setAssets(fetchedAssets);
          if (fetchedAssets.length === 0) {
            console.warn("No assets found for this type and location");
          }
        } else {
          console.error("Failed to fetch assets:", await res.text());
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
  }, [
    formData.buildingId,
    formData.floorId,
    formData.roomId,
    formData.assetTypeId,
    formData.branchId,
    locationLevel,
  ]);

  // ============================================================
  // دوال اختيار الأصول
  // ============================================================

  const openAssetDialog = useCallback(() => {
    setTempSelectedAssetIds([...selectedAssetIds]);
    setAssetDialogOpen(true);
  }, [selectedAssetIds]);

  const confirmAssetSelection = useCallback(() => {
    setSelectedAssetIds(tempSelectedAssetIds);
    setAssetDialogOpen(false);
  }, [tempSelectedAssetIds]);

  const removeAsset = useCallback((assetId: string) => {
    setSelectedAssetIds((prev) => prev.filter((id) => id !== assetId));
  }, []);

  // ============================================================
  // دالة الإرسال
  // ============================================================

  const handleSubmit = useCallback(async () => {
    if (!formData.title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }

    let locationValid = false;
    if (locationLevel === "room" && formData.roomId) locationValid = true;
    else if (locationLevel === "floor" && formData.floorId)
      locationValid = true;
    else if (locationLevel === "building" && formData.buildingId)
      locationValid = true;

    if (!locationValid) {
      toast.error(t("locationRequired"));
      return;
    }

    if (!formData.branchId) {
      toast.error(t("branchRequired"));
      return;
    }

    if (!formData.priorityId) {
      toast.error(t("priorityRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description || "");
      // ✅ إرسال workOrderTypeId بدلاً من type
      formDataToSend.append("workOrderTypeId", formData.workOrderTypeId);
      formDataToSend.append("priorityId", formData.priorityId);
      formDataToSend.append("statusId", formData.statusId || "");
      formDataToSend.append("branchId", formData.branchId);
      formDataToSend.append("assetTypeId", formData.assetTypeId || "");
      formDataToSend.append("notes", formData.notes || "");
      formDataToSend.append("source", formData.source);
      formDataToSend.append("sourceId", formData.sourceId || "");
      formDataToSend.append("category", formData.category || "");
      formDataToSend.append("reason", formData.reason || "");
      formDataToSend.append("assetIds", JSON.stringify(selectedAssetIds));

      if (locationLevel === "room" && formData.roomId) {
        formDataToSend.append("roomId", formData.roomId);
      } else if (locationLevel === "floor" && formData.floorId) {
        formDataToSend.append("floorId", formData.floorId);
      } else if (locationLevel === "building" && formData.buildingId) {
        formDataToSend.append("buildingId", formData.buildingId);
      }

      attachedFiles.forEach((file) => {
        formDataToSend.append("attachments", file);
      });

      const res = await fetch("/api/work-orders", {
        method: "POST",
        body: formDataToSend,
      });

      if (res.ok) {
        toast.success(t("createSuccess"));
        router.push(`/${locale}/work-orders`);
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
  }, [formData, selectedAssetIds, locationLevel, attachedFiles, router, locale, t]);

  // ============================================================
  // التصميم (JSX)
  // ============================================================

  return (
    <div className="relative space-y-8 p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Wrench className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t("newTitle")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("newSubtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <InfoBar
            createdAt={currentDate}
            createdBy={currentUser}
            isRtl={isRtl}
          />

          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
                <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "المعلومات الأساسية" : "Basic Information"}
              </h2>
            </div>
            <BasicInfoCard
              formData={formData}
              setFormData={setFormData}
              priorities={initialPriorities}
              statuses={initialStatuses}
              workOrderTypes={initialWorkOrderTypes}
              isRtl={isRtl}
              t={t}
              isSourceEditable={isSourceEditable}
            />
          </div>

          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "الموقع والأصل" : "Location & Asset"}
              </h2>
            </div>
            <LocationCard
              formData={formData}
              setFormData={setFormData}
              buildings={buildings}
              floors={floors}
              rooms={rooms}
              locationLevel={locationLevel}
              setLocationLevel={setLocationLevel}
              loadingFloors={loadingFloors}
              loadingRooms={loadingRooms}
              isRtl={isRtl}
              assetTypes={initialAssetTypes}
              assets={assets}
              selectedAssetIds={selectedAssetIds}
              loadingAssets={loadingAssets}
              assetDialogOpen={assetDialogOpen}
              tempSelectedAssetIds={tempSelectedAssetIds}
              onOpenAssetDialog={openAssetDialog}
              onConfirmAssetSelection={confirmAssetSelection}
              onRemoveAsset={removeAsset}
              onTempAssetChange={setTempSelectedAssetIds}
              onAssetDialogOpenChange={setAssetDialogOpen}
              isLocationSelected={!!(
                (locationLevel === "room" && formData.roomId) ||
                (locationLevel === "floor" && formData.floorId) ||
                (locationLevel === "building" && formData.buildingId)
              )}
              t={t}
            />
          </div>
        </div>

        <div className="space-y-6">
          <NotesEditor
            value={formData.notes ?? undefined}
            onChange={(value) => setFormData({ ...formData, notes: value })}
            isRtl={isRtl}
            t={t}
          />

          <AttachmentsCard
            onFilesChange={setAttachedFiles}
            isRtl={isRtl}
            t={t}
          />

          <GuidelinesCard isRtl={isRtl} />

          <div className="flex gap-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12 font-medium"
            >
              <X className="h-4 w-4 ml-2" />
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5 ml-2" />
              )}
              {t("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}