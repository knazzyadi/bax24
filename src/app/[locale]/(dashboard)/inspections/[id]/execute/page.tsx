// src/app/[locale]/(dashboard)/inspections/[id]/execute/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Loader2, Eye } from "lucide-react";
import { CreateFindingModal } from "../../CreateFindingModal";

// ============================================================
// Types
// ============================================================

interface Finding {
  id: string;
  title: string;
  riskLevel: string;
  status: string;
  description?: string | null;
  correctiveAction?: string | null;
  dueDate?: string | null;
}

interface InspectionResult {
  id: string;
  status: "PASS" | "FAIL" | "NOT_APPLICABLE" | "PENDING";
  notes?: string | null;
  finding?: Finding | null;
}

interface InspectionItemWithResult {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string;
  result: InspectionResult | null;
}

// ============================================================
// Component
// ============================================================

export default function InspectionExecutionPage({
  params,
}: {
  params: { id: string };
}) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("Inspections");
  const router = useRouter();

  const [items, setItems] = useState<InspectionItemWithResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [findingModalOpen, setFindingModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState("");

  // ============================================================
  // Initial Load
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadItems = async () => {
      setLoading(true);

      try {
        const res = await fetch(
          `/api/inspections/${params.id}/items`
        );

        if (res.ok) {
          const data = await res.json();

          if (!cancelled) {
            setItems(data);
          }
        } else {
          toast.error(t("fetchError"));
        }
      } catch {
        if (!cancelled) {
          toast.error(t("networkError"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadItems();

    return () => {
      cancelled = true;
    };
  }, [params.id, t]);

  // ============================================================
  // Reload Items After Actions
  // ============================================================

  const reloadItems = async () => {
    try {
      const res = await fetch(
        `/api/inspections/${params.id}/items`
      );

      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      toast.error(t("networkError"));
    }
  };

  // ============================================================
  // Finding Modal
  // ============================================================

  const openFindingModal = (resultId: string) => {
    setSelectedResultId(resultId);
    setFindingModalOpen(true);
  };

  const closeFindingModal = () => {
    setFindingModalOpen(false);
    setSelectedResultId("");
  };

  // ============================================================
  // Update Result
  // ============================================================

  const handleResultChange = async (
    itemId: string,
    status: string
  ) => {
    try {
      const res = await fetch(
        `/api/inspections/${params.id}/items/${itemId}/result`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      if (res.ok) {
        toast.success(t("resultUpdated"));
        await reloadItems();
      } else {
        const error = await res.json();

        toast.error(
          error.error || t("updateError")
        );
      }
    } catch {
      toast.error(t("networkError"));
    }
  };

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6 p-6">

      <h1 className="text-2xl font-bold">
        {t("executionTitle")}
      </h1>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t("executionSubtitle")}
      </p>


      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">

        <table className="w-full min-w-[800px]">

          <thead className="bg-slate-50 dark:bg-slate-800/50">

            <tr>

              <th className="text-right p-4 text-sm font-medium">
                {t("item")}
              </th>

              <th className="text-right p-4 text-sm font-medium">
                {t("result")}
              </th>

              <th className="text-right p-4 text-sm font-medium">
                {t("finding")}
              </th>

              <th className="text-right p-4 text-sm font-medium">
                {t("actions")}
              </th>

            </tr>

          </thead>


          <tbody>

            {items.map((item) => (

              <tr
                key={item.id}
                className="border-t border-slate-100 dark:border-slate-800"
              >

                <td className="p-4 font-medium">

                  {isRtl
                    ? item.name
                    : item.nameEn || item.name}

                  {item.code && (
                    <span className="block text-xs font-mono text-slate-400">
                      {item.code}
                    </span>
                  )}

                </td>


                <td className="p-4">

                  <select
                    value={
                      item.result?.status || "PENDING"
                    }
                    onChange={(e) =>
                      handleResultChange(
                        item.id,
                        e.target.value
                      )
                    }
                    className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
                  >

                    <option value="PENDING">
                      —
                    </option>

                    <option value="PASS">
                      {t("pass")}
                    </option>

                    <option value="FAIL">
                      {t("fail")}
                    </option>

                    <option value="NOT_APPLICABLE">
                      {t("notApplicable")}
                    </option>

                  </select>

                </td>


                <td className="p-4">

                  {item.result?.finding ? (

                    <div className="space-y-1">

                      <span className="text-amber-600 flex items-center gap-1.5">

                        <AlertTriangle className="h-4 w-4" />

                        <span className="font-medium">
                          {item.result.finding.title}
                        </span>

                      </span>


                      <div className="text-xs text-slate-500">

                        {isRtl ? "الخطورة" : "Risk"}:{" "}
                        {item.result.finding.riskLevel}

                      </div>


                      <div className="text-xs text-slate-500">

                        {isRtl ? "الحالة" : "Status"}:{" "}
                        {item.result.finding.status}

                      </div>


                      {item.result.finding.dueDate && (

                        <div className="text-xs text-slate-500">

                          {isRtl ? "الاستحقاق" : "Due"}:{" "}

                          {new Date(
                            item.result.finding.dueDate
                          ).toLocaleDateString(
                            isRtl ? "ar" : "en"
                          )}

                        </div>

                      )}

                    </div>

                  ) : (

                    <span className="text-slate-400">
                      -
                    </span>

                  )}

                </td>


                <td className="p-4">

                  {item.result?.status === "FAIL" &&
                    !item.result?.finding && (

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        openFindingModal(
                          item.result!.id
                        )
                      }
                      className="gap-1"
                    >

                      <Plus className="h-4 w-4" />

                      {t("addFinding")}

                    </Button>

                  )}


                  {item.result?.finding && (

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {

                        const findingId =
                          item.result?.finding?.id;

                        if (findingId) {
                          router.push(
                            `/${locale}/findings/${findingId}`
                          );
                        }

                      }}
                      className="gap-1"
                    >

                      <Eye className="h-4 w-4" />

                      {t("viewFinding")}

                    </Button>

                  )}

                </td>


              </tr>

            ))}

          </tbody>

        </table>

      </div>


      <CreateFindingModal
        open={findingModalOpen}
        onClose={closeFindingModal}
        inspectionResultId={selectedResultId}
        onSuccess={reloadItems}
        isRtl={isRtl}
      />

    </div>
  );
}