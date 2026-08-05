// src/app/[locale]/(dashboard)/work-orders/[id]/edit/ClientWrapper.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EditForm } from "./EditForm";
import type { WorkOrderFormData } from "../../types";

// ============================================================
// الأنواع
// ============================================================

interface Option {
  id: string;
  name: string;
  code?: string | null;
  fullCode?: string;
  buildingId?: string | null;
  floorId?: string | null;
}

interface SelectedAsset {
  id: string;
  name: string;
  code?: string | null;
}

// ✅ FormData يمدد WorkOrderFormData مع تعديل الخصائص المطلوبة
// تم حذف [key: string]: unknown; لتجنب تعارض التوقيع الفهرسي
interface FormData extends WorkOrderFormData {
  id?: string;
  branchId?: string | null;
  selectedAssets?: SelectedAsset[];
}

interface EditWorkOrderClientProps {
  locale: string;
  initialData: FormData;
  priorities: Option[];
  statuses: Option[];
  assetTypes: Option[];
  buildings: Option[];
  initialWorkOrderTypes: Option[];
}

// ============================================================
// المكون
// ============================================================

export function EditWorkOrderClient({
  locale,
  initialData,
  priorities,
  statuses,
  assetTypes,
  buildings,
  initialWorkOrderTypes,
}: EditWorkOrderClientProps) {
  const router = useRouter();
  const isRtl = locale === "ar";
  const t = useTranslations("WorkOrdersForm");

  const [formData, setFormData] = useState<FormData>({
    ...initialData,
    assetTypeId: initialData.assetTypeId ?? null,
    workOrderTypeId: initialData.workOrderTypeId ?? "",
    source: initialData.source ?? "manual",
    sourceId: initialData.sourceId ?? null,
    selectedAssets: initialData.selectedAssets || [],
  });

  const [saving, setSaving] = useState(false);

  const [floors, setFloors] = useState<Option[]>([]);
  const [rooms, setRooms] = useState<Option[]>([]);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // ============================================================
  // جلب الأدوار (Floors)
  // ============================================================

  useEffect(() => {
    const buildingId = formData.buildingId;
    if (!buildingId) return;

    const fetchFloors = async () => {
      setLoadingFloors(true);

      try {
        const res = await fetch(
          `/api/locations/buildings/${buildingId}/floors`
        );

        const data: Option[] = res.ok ? await res.json() : [];

        setFloors(Array.isArray(data) ? data : []);
      } catch {
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    };

    void fetchFloors();
  }, [formData.buildingId]);

  // ============================================================
  // جلب الغرف (Rooms)
  // ============================================================

  useEffect(() => {
    const floorId = formData.floorId;
    const buildingId = formData.buildingId;

    if (!floorId || !buildingId) return;

    const fetchRooms = async () => {
      setLoadingRooms(true);

      try {
        const res = await fetch(
          `/api/locations/floors/${floorId}/rooms`
        );

        const data: Option[] = res.ok ? await res.json() : [];

        const roomsWithExtra = data.map((room) => ({
          ...room,
          buildingId: room.buildingId ?? buildingId,
          floorId: room.floorId ?? floorId,
        }));

        setRooms(roomsWithExtra);
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };

    void fetchRooms();
  }, [formData.floorId, formData.buildingId]);

  // ============================================================
  // دالة الإرسال
  // ============================================================

  const handleSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        workOrderTypeId: data.workOrderTypeId || null,
        priorityId: data.priorityId || null,
        statusId: data.statusId || null,
        branchId: data.branchId ?? null,
        assetTypeId: data.assetTypeId || null,
        assetIds: data.assetIds || [],
        notes: data.notes || null,
        roomId: data.roomId || null,
        floorId: data.floorId || null,
        buildingId: data.buildingId || null,
        source: data.source,
        sourceId: data.sourceId,
      };

      const res = await fetch(`/api/work-orders/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(t("updateSuccess"));
        router.push(`/${locale}/work-orders/${formData.id}`);
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || t("updateError"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setSaving(false);
    }
  };

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
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isRtl ? "العودة" : "Back"}
        </Button>
      </div>

      <EditForm
        formData={formData}
        setFormData={setFormData}
        priorities={priorities}
        statuses={statuses}
        assetTypes={assetTypes}
        buildings={buildings}
        floors={floors}
        rooms={rooms}
        loadingFloors={loadingFloors}
        loadingRooms={loadingRooms}
        onSave={handleSubmit}
        isSaving={saving}
        isRtl={isRtl}
        t={t}
        workOrderTypes={initialWorkOrderTypes}
        selectedAssets={formData.selectedAssets || []}
      />
    </div>
  );
}