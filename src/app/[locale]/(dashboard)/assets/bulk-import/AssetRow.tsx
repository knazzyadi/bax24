// src/app/[locale]/(dashboard)/assets/bulk-import/components/AssetRow.tsx
"use client";

import React, { memo } from "react";
import { useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDateInput } from "./dateHelpers";
import type { AssetType, AssetStatus } from "@/types/assets";
import type { BulkAssetRow } from "./bulkImport.types";

interface AssetRowProps {
  row: BulkAssetRow;
  index: number;
  types: AssetType[];
  statuses: AssetStatus[];
  updateRow: (index: number, field: keyof BulkAssetRow, value: string) => void;
  removeRow: (index: number) => void;
  isLastRow: boolean;
}

export const AssetRow = memo(function AssetRow({
  row,
  index,
  types,
  statuses,
  updateRow,
  removeRow,
  isLastRow,
}: AssetRowProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
      <td className="p-2 text-center text-slate-400">{index + 1}</td>
      <td className="p-2 min-w-[120px]">
        <Input
          value={row.name}
          onChange={(e) => updateRow(index, "name", e.target.value)}
          placeholder={isRtl ? "اسم الأصل" : "Asset name"}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-700"
        />
      </td>
      <td className="p-2 min-w-[120px]">
        <Input
          value={row.nameEn}
          onChange={(e) => updateRow(index, "nameEn", e.target.value)}
          placeholder={isRtl ? "اسم إنجليزي" : "English name"}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-700"
        />
      </td>
      <td className="p-2 min-w-[120px]">
        <Input
          value={row.description}
          onChange={(e) => updateRow(index, "description", e.target.value)}
          placeholder={isRtl ? "وصف" : "Description"}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-700"
        />
      </td>
      <td className="p-2 min-w-[140px]">
        <Select
          value={row.typeId}
          onValueChange={(v: string) => updateRow(index, "typeId", v)}
        >
          <SelectTrigger className="h-9 rounded-lg border-slate-200 dark:border-slate-700">
            <SelectValue placeholder={isRtl ? "النوع" : "Type"} />
          </SelectTrigger>
          <SelectContent>
            {types.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {isRtl ? type.name : type.nameEn || type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-2 min-w-[140px]">
        <Select
          value={row.statusId}
          onValueChange={(v: string) => updateRow(index, "statusId", v)}
        >
          <SelectTrigger className="h-9 rounded-lg border-slate-200 dark:border-slate-700">
            <SelectValue placeholder={isRtl ? "الحالة" : "Status"} />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color || "#6b7280" }}
                  />
                  {isRtl ? status.name : status.nameEn || status.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-2 min-w-[120px]">
        <Input
          type="date"
          value={formatDateInput(row.purchaseDate)}
          onChange={(e) => updateRow(index, "purchaseDate", e.target.value)}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-700"
        />
      </td>
      <td className="p-2 min-w-[120px]">
        <Input
          type="date"
          value={formatDateInput(row.operationDate)}
          onChange={(e) => updateRow(index, "operationDate", e.target.value)}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-700"
        />
      </td>
      <td className="p-2 min-w-[120px]">
        <Input
          type="date"
          value={formatDateInput(row.warrantyEnd)}
          onChange={(e) => updateRow(index, "warrantyEnd", e.target.value)}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-700"
        />
      </td>
      <td className="p-2 min-w-[120px]">
        <Input
          type="date"
          value={formatDateInput(row.lastMaintenanceDate)}
          onChange={(e) => updateRow(index, "lastMaintenanceDate", e.target.value)}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-700"
        />
      </td>
      <td className="p-2 min-w-[120px]">
        <Input
          value={row.serialNumber}
          onChange={(e) => updateRow(index, "serialNumber", e.target.value)}
          placeholder={isRtl ? "رقم تسلسلي" : "Serial"}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-700"
        />
      </td>
      <td className="p-2 min-w-[120px]">
        <Input
          value={row.manufacturer}
          onChange={(e) => updateRow(index, "manufacturer", e.target.value)}
          placeholder={isRtl ? "المصنع" : "Manufacturer"}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-700"
        />
      </td>
      <td className="p-2 min-w-[120px]">
        <Input
          value={row.model}
          onChange={(e) => updateRow(index, "model", e.target.value)}
          placeholder={isRtl ? "الموديل" : "Model"}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-700"
        />
      </td>
      <td className="p-2 min-w-[120px]">
        <Input
          value={row.supplier}
          onChange={(e) => updateRow(index, "supplier", e.target.value)}
          placeholder={isRtl ? "المورد" : "Supplier"}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-700"
        />
      </td>
      <td className="p-2 min-w-[120px]">
        <Input
          value={row.notes}
          onChange={(e) => updateRow(index, "notes", e.target.value)}
          placeholder={isRtl ? "ملاحظات" : "Notes"}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-700"
        />
      </td>
      <td className="p-2 text-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeRow(index)}
          disabled={isLastRow}
          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
});

AssetRow.displayName = "AssetRow";