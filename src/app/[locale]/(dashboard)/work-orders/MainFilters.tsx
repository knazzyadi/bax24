// src/app/[locale]/(dashboard)/work-orders/components/MainFilters.tsx
"use client";

import { useMemo } from "react";
import type { FilterSection } from "@/components/shared/DataList";

interface MainFiltersProps {
  statuses: { id: string; name: string; nameEn?: string }[];
  priorities: { id: string; name: string; nameEn?: string }[];
  isRtl: boolean;
  selectedStatusId: string;
  selectedPriorityId: string;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
}

export function MainFilters({
  statuses,
  priorities,
  isRtl,
  selectedStatusId,
  selectedPriorityId,
  onStatusChange,
  onPriorityChange,
}: MainFiltersProps) {
  const filterSections = useMemo(
    () => [
      {
        id: "statusId",
        label: isRtl ? "الحالة" : "Status",
        options: [
          { value: "all", label: isRtl ? "جميع الحالات" : "All Statuses" },
          ...statuses.map((status) => ({
            value: status.id,
            label: isRtl ? status.name : status.nameEn || status.name,
          })),
        ],
      },
      {
        id: "priorityId",
        label: isRtl ? "الأولوية" : "Priority",
        options: [
          { value: "all", label: isRtl ? "جميع الأولويات" : "All Priorities" },
          ...priorities.map((priority) => ({
            value: priority.id,
            label: isRtl ? priority.name : priority.nameEn || priority.name,
          })),
        ],
      },
    ],
    [isRtl, statuses, priorities]
  );

  // هذا المكون يمكن استخدامه داخل DataList مباشرة،
  // لكننا سنعيد استخدامه في WorkOrdersList
  // يمكننا إما تمرير filterSections إلى DataList أو بناء DataList هنا.
  // بما أن DataList يقبل filterSections، سنعيد export للمصفوفة.

  return { filterSections };
}