// src/app/[locale]/(dashboard)/inspections/[id]/useInspectionDetail.ts
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function useInspectionDetail(id: string) {
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspection = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inspections/${id}`);
      if (!res.ok) throw new Error("Failed to load inspection");
      const data = await res.json();
      setInspection(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const updateResult = (itemId: string, field: string, value: any) => {
    setInspection((prev: any) => {
      const updatedResults = prev.results.map((r: any) => {
        if (r.itemId === itemId) {
          return { ...r, [field]: value };
        }
        return r;
      });
      return { ...prev, results: updatedResults };
    });
  };

  const saveInspection = async () => {
    try {
      const resultsArray = inspection.results.map((r: any) => ({
        resultId: r.id,
        itemId: r.itemId,
        result: r.result,
        notes: r.notes,
        imageUrl: r.imageUrl,
        workOrderId: r.workOrderId,
      }));

      const res = await fetch(`/api/inspections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: resultsArray }),
      });

      if (!res.ok) throw new Error("Save failed");
      toast.success("تم حفظ التغييرات");
      await fetchInspection(); // إعادة تحميل البيانات بعد الحفظ
    } catch (err) {
      toast.error("فشل الحفظ");
    }
  };

  useEffect(() => {
    if (id) fetchInspection();
  }, [id]);

  return { inspection, loading, error, updateResult, saveInspection };
}