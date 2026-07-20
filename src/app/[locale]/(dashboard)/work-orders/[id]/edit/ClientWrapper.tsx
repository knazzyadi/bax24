// src/app/[locale]/(dashboard)/work-orders/[id]/edit/ClientWrapper.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2, Wrench, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EditForm } from "./EditForm";

interface EditWorkOrderClientProps {
  locale: string;
  initialData: any;
  priorities: any[];
  statuses: any[];
  assetTypes: any[];
  buildings: any[];
  initialWorkOrderTypes: any[];
}

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

  // ✅ التأكد من أن جميع الحقول المطلوبة موجودة في formData
  const [formData, setFormData] = useState({
    ...initialData,
    assetTypeId: initialData.assetTypeId ?? null,
    workOrderTypeId: initialData.workOrderTypeId ?? "",
    source: initialData.source ?? "manual",
    sourceId: initialData.sourceId ?? null,
    selectedAssets: initialData.selectedAssets || [],
  });

  const [saving, setSaving] = useState(false);

  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // جلب الأدوار
  useEffect(() => {
    if (!formData.buildingId) {
      setFloors([]);
      return;
    }
    const fetchFloors = async () => {
      setLoadingFloors(true);
      try {
        const res = await fetch(`/api/buildings/${formData.buildingId}/floors`);
        if (res.ok) {
          const data = await res.json();
          setFloors(Array.isArray(data) ? data : []);
        } else {
          setFloors([]);
        }
      } catch {
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    };
    fetchFloors();
  }, [formData.buildingId]);

  // جلب الغرف - بدون إنشاء fullCode باستخدام المعرفات الطويلة
  useEffect(() => {
    if (!formData.floorId) {
      setRooms([]);
      return;
    }
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await fetch(`/api/floors/${formData.floorId}/rooms`);
        if (res.ok) {
          const data = await res.json();
          // ✅ نمرر الغرف كما هي، مع الحفاظ على room.code و room.name
          const roomsData = Array.isArray(data) ? data : [];
          setRooms(roomsData);
        } else {
          setRooms([]);
        }
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [formData.floorId, formData.buildingId]);

  const handleSubmit = async (data: any) => {
    setSaving(true);
    try {
      const payload = {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        workOrderTypeId: data.workOrderTypeId || null,
        priorityId: data.priorityId || null,
        statusId: data.statusId || null,
        branchId: data.branchId,
        assetTypeId: data.assetTypeId || null,
        assetIds: data.assetIds || [],
        notes: data.notes || null,
        roomId: data.locationLevel === "room" ? data.roomId : null,
        floorId: data.locationLevel === "floor" ? data.floorId : null,
        buildingId: data.locationLevel === "building" ? data.buildingId : null,
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

  return (
    <div className="relative space-y-8 p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Wrench className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t("editTitle")}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("editSubtitle")}</p>
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
        // ✅ تمرير الأصول المختارة إلى EditForm
        selectedAssets={formData.selectedAssets || []}
      />
    </div>
  );
}