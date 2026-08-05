// src/app/[locale]/(dashboard)/work-orders/components/MainFilters.tsx
"use client";

import { useMemo } from "react";

interface MainFiltersProps {
  statuses: { id: string; name: string; nameEn?: string }[];
  priorities: { id: string; name: string; nameEn?: string }[];
  isRtl: boolean;
}

export function MainFilters({
  statuses,
  priorities,
  isRtl,
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

  return { filterSections };
}