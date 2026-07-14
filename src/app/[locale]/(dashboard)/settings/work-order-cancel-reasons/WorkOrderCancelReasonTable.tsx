// src/app/[locale]/(dashboard)/settings/work-order-cancel-reasons/WorkOrderCancelReasonTable.tsx
"use client";

import { useTranslations } from "next-intl";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/layout/DataTable";
import type { WorkOrderCancelReason } from "@/types/work-orders";

interface WorkOrderCancelReasonTableProps {
  data: WorkOrderCancelReason[];
  onEdit: (reason: WorkOrderCancelReason) => void;
  onDelete: (id: string) => void;
  isRtl: boolean;
}

export function WorkOrderCancelReasonTable({
  data,
  onEdit,
  onDelete,
  isRtl,
}: WorkOrderCancelReasonTableProps) {
  const t = useTranslations("WorkOrderCancelReasons");

  const columns = [
    {
      key: "name",
      title: t("name"),
      render: (row: WorkOrderCancelReason) => (
        <span className="font-medium text-foreground">
          {isRtl ? row.name : row.nameEn || row.name}
        </span>
      ),
    },
    {
      key: "code",
      title: t("code"),
      render: (row: WorkOrderCancelReason) => row.code || "—",
    },
    {
      key: "description",
      title: t("description"),
      render: (row: WorkOrderCancelReason) => (
        <span className="text-sm text-muted-foreground">
          {row.description || "—"}
        </span>
      ),
    },
    {
      key: "order",
      title: t("order"),
      render: (row: WorkOrderCancelReason) => row.order ?? "—",
    },
    {
      key: "isDefault",
      title: t("default"),
      render: (row: WorkOrderCancelReason) =>
        row.isDefault ? (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground/30" />
        ),
    },
    {
      key: "isActive",
      title: t("active"),
      render: (row: WorkOrderCancelReason) => (
        <span
          className={
            row.isActive
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground"
          }
        >
          {row.isActive ? t("active") : t("inactive")}
        </span>
      ),
    },
    {
      key: "actions",
      title: t("actions"),
      align: "right",
      render: (row: WorkOrderCancelReason) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(row)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary transition-colors"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(row.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} rowKey="id" />;
}