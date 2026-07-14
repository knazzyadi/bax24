// src/app/[locale]/(dashboard)/settings/asset-statuses/AssetStatusTable.tsx
"use client";

import { useTranslations } from "next-intl";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/layout/DataTable";
import type { AssetStatus } from "@/types/assets";

interface AssetStatusTableProps {
  data: AssetStatus[];
  onEdit: (status: AssetStatus) => void;
  onDelete: (id: string) => void;
  isRtl: boolean;
}

export function AssetStatusTable({
  data,
  onEdit,
  onDelete,
  isRtl,
}: AssetStatusTableProps) {
  const t = useTranslations("AssetStatuses");

  const columns = [
    {
      key: "name",
      title: t("name"),
      render: (row: AssetStatus) => (
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: row.color || "#6B7280" }}
          />
          <span className="font-medium text-foreground">
            {isRtl ? row.name : row.nameEn || row.name}
          </span>
        </div>
      ),
    },
    {
      key: "code",
      title: t("code"),
      render: (row: AssetStatus) => row.code || "—",
    },
    {
      key: "isDefault",
      title: t("default"),
      render: (row: AssetStatus) =>
        row.isDefault ? (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground/30" />
        ),
    },
    {
      key: "isActive",
      title: t("active"),
      render: (row: AssetStatus) => (
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
      key: "order",
      title: t("order"),
      render: (row: AssetStatus) => row.order ?? "—",
    },
    {
      key: "actions",
      title: t("actions"),
      align: "right",
      render: (row: AssetStatus) => (
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