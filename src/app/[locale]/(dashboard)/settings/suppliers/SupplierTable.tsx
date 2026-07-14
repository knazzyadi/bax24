// src/app/[locale]/(dashboard)/settings/suppliers/SupplierTable.tsx
"use client";

import { useTranslations } from "next-intl";
import { Edit, Trash2, CheckCircle, XCircle, User, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/layout/DataTable";
import type { Supplier } from "@/types/assets";

interface SupplierTableProps {
  data: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
  isRtl: boolean;
}

export function SupplierTable({
  data,
  onEdit,
  onDelete,
  isRtl,
}: SupplierTableProps) {
  const t = useTranslations("Suppliers");

  const columns = [
    {
      key: "name",
      title: t("name"),
      render: (row: Supplier) => (
        <span className="font-medium text-foreground">
          {isRtl ? row.name : row.nameEn || row.name}
        </span>
      ),
    },
    {
      key: "code",
      title: t("code"),
      render: (row: Supplier) => row.code || "—",
    },
    {
      key: "contactPerson",
      title: t("contactPerson"),
      render: (row: Supplier) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          {row.contactPerson || "—"}
        </div>
      ),
    },
    {
      key: "phone",
      title: t("phone"),
      render: (row: Supplier) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          {row.phone || "—"}
        </div>
      ),
    },
    {
      key: "email",
      title: t("email"),
      render: (row: Supplier) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          {row.email || "—"}
        </div>
      ),
    },
    {
      key: "isActive",
      title: t("active"),
      render: (row: Supplier) => (
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
      render: (row: Supplier) => (
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