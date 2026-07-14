// src/app/[locale]/(dashboard)/settings/work-order-statuses/WorkOrderStatusTable.tsx
"use client";

import { useTranslations } from "next-intl";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { WorkOrderStatus } from "@/types/work-orders";

interface WorkOrderStatusTableProps {
  data: WorkOrderStatus[];
  onEdit: (status: WorkOrderStatus) => void;
  onDelete: (id: string) => void;
  isRtl: boolean;
}

export function WorkOrderStatusTable({
  data,
  onEdit,
  onDelete,
  isRtl,
}: WorkOrderStatusTableProps) {
  const t = useTranslations("WorkOrderStatuses");

  const columns = [
    {
      key: "name",
      title: t("name"),
      render: (row: WorkOrderStatus) => (
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: row.color || "#6B7280" }}
          />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {isRtl ? row.name : row.nameEn || row.name}
          </span>
        </div>
      ),
    },
    {
      key: "code",
      title: t("code"),
      render: (row: WorkOrderStatus) => row.code || "—",
    },
    {
      key: "isDefault",
      title: t("default"),
      render: (row: WorkOrderStatus) =>
        row.isDefault ? (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        ) : (
          <XCircle className="h-4 w-4 text-slate-300" />
        ),
    },
    {
      key: "isActive",
      title: t("active"),
      render: (row: WorkOrderStatus) => (
        <StatusBadge status={row.isActive ? "active" : "inactive"} />
      ),
    },
    {
      key: "order",
      title: t("order"),
      render: (row: WorkOrderStatus) => row.order ?? "—",
    },
    {
      key: "actions",
      title: t("actions"),
      align: "right",
      render: (row: WorkOrderStatus) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(row)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(row.id)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} rowKey="id" />;
}