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
  ClipboardList,
  Paperclip,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { BasicInfoCard } from "../BasicInfoCard";
import { LocationCard } from "../LocationCard";
import { InfoBar } from "../InfoBar";
import { NotesEditor } from "../NotesEditor";
import { GuidelinesCard } from "../GuidelinesCard";
import { AttachmentsCard } from "../AttachmentsCard";
import type { WorkOrderFormData, WorkOrderSource } from "../types";

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
  initialSource: WorkOrderSource; // ✅ تم التعديل
  initialSourceId: string | null;
  isSourceEditable: boolean;
}

// ============================================================
// تعريف نمط البطاقة
// ============================================================

const cardStyle =
  "bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300";

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

  const [formData, setFormData] = useState<WorkOrderFormData>({
    title: "",
    description: "",
    workOrderTypeId: defaultWorkOrderTypeId,
    source: initialSource,
    priorityId: defaultPriorityId,
    statusId: defaultStatusId,
    assetTypeId: "",
    category: "", // ✅ أضفنا category (إذا كان موجوداً في النوع)
    reason: "",
    notes: "",
    branchId: "",
    buildingId: "",
    floorId: "",
    roomId: "",
    assetIds: [],
    assignedTo: "", // ✅ تم التعديل
    sourceId: initialSourceId,
  });

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
          `/api/locations/buildings/${formData.buildingId}/floors`
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
          `/api/locations/floors/${formData.floorId}/rooms`
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
    if (!formData.assetTypeId) {
      setAssets([]);
      return;
    }

    let level: 'room' | 'floor' | 'building' | null = null;
    let id: string | null = null;

    if (formData.roomId) {
      level = 'room';
      id = formData.roomId;
    } else if (formData.floorId) {
      level = 'floor';
      id = formData.floorId;
    } else if (formData.buildingId) {
      level = 'building';
      id = formData.buildingId;
    }

    if (!level || !id) {
      setAssets([]);
      return;
    }

    const params = new URLSearchParams();
    params.append('typeId', formData.assetTypeId);
    if (formData.branchId) params.append('branchId', formData.branchId);
    if (level === 'room') params.append('roomId', id);
    else if (level === 'floor') params.append('floorId', id);
    else if (level === 'building') params.append('buildingId', id);

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
            fetchedAssets = [];
          }
          setAssets(fetchedAssets);
        } else {
          setAssets([]);
        }
      } catch (error) {
        console.error('Error fetching assets:', error);
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

    if (!formData.buildingId || !formData.floorId) {
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
      formDataToSend.append("workOrderTypeId", formData.workOrderTypeId ?? ""); // ✅
      formDataToSend.append("priorityId", formData.priorityId);
      formDataToSend.append("statusId", formData.statusId || "");
      formDataToSend.append("branchId", formData.branchId);
      formDataToSend.append("assetTypeId", formData.assetTypeId || "");
      formDataToSend.append("notes", formData.notes || "");
      formDataToSend.append("source", formData.source ?? "manual"); // ✅
      formDataToSend.append("sourceId", formData.sourceId || "");
      formDataToSend.append("category", formData.category || ""); // ✅ إذا كان موجوداً
      formDataToSend.append("reason", formData.reason || "");
      formDataToSend.append("assetIds", JSON.stringify(selectedAssetIds));

      formDataToSend.append("buildingId", formData.buildingId);
      formDataToSend.append("floorId", formData.floorId);
      if (formData.roomId) {
        formDataToSend.append("roomId", formData.roomId);
      }

      // إضافة assignedTo إذا كان موجوداً
      if (formData.assignedTo) {
        formDataToSend.append("assignedTo", formData.assignedTo);
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
  }, [formData, selectedAssetIds, attachedFiles, router, locale, t]);

  // ============================================================
  // تحديد ما تم اختيار موقع
  // ============================================================
  const isLocationSelected = !!(formData.buildingId && formData.floorId);

  // ============================================================
  // التصميم (JSX)
  // ============================================================

  return (
    <div className="relative min-h-screen bg-slate-50/80 dark:bg-slate-950/80 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* رأس الصفحة */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
              <Wrench className="h-8 w-8 text-indigo-700 dark:text-indigo-300" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
                {t("newTitle")}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("newSubtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* شريط المعلومات */}
            <InfoBar
              createdAt={currentDate}
              createdBy={currentUser}
              isRtl={isRtl}
            />

            {/* بطاقة المعلومات الأساسية */}
            <div className={cardStyle}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
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

            {/* بطاقة الموقع والأصل */}
            <div className={cardStyle}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
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
                isLocationSelected={isLocationSelected}
                t={t}
              />
            </div>
          </div>

          {/* العمود الجانبي */}
          <div className="space-y-6">
            {/* الملاحظات */}
            <div className={cardStyle}>
              <NotesEditor
                value={formData.notes ?? undefined}
                onChange={(value) => setFormData({ ...formData, notes: value })}
                isRtl={isRtl}
                t={t}
              />
            </div>

            {/* المرفقات */}
            <div className={cardStyle}>
              <AttachmentsCard
                onFilesChange={setAttachedFiles}
                isRtl={isRtl}
                t={t}
              />
            </div>

            {/* الإرشادات */}
            <div className={cardStyle}>
              <GuidelinesCard isRtl={isRtl} />
            </div>

            {/* أزرار الإجراء */}
            <div className="flex gap-3">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex-1 rounded-xl border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 h-12 font-medium"
              >
                <X className="h-4 w-4 ml-2" />
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium h-12 shadow-md hover:shadow-lg transition-all duration-200"
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
    </div>
  );
}