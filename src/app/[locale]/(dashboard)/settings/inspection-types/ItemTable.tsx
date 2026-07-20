// src/app/[locale]/(dashboard)/settings/inspection-types/ItemTable.tsx
"use client";

import { Edit, Trash2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InspectionItem } from "./types";

interface ItemTableProps {
  data: InspectionItem[];
  onEdit: (item: InspectionItem) => void;
  onDelete: (id: string) => void;
  isRtl: boolean;
}

const riskLevelMap = {
  low: { label: { en: "Low", ar: "منخفض" }, color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" },
  medium: { label: { en: "Medium", ar: "متوسط" }, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400" },
  high: { label: { en: "High", ar: "عالي" }, color: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400" },
  critical: { label: { en: "Critical", ar: "حرج" }, color: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400" },
};

const inputTypeMap = {
  pass_fail: { en: "Pass/Fail", ar: "نعم/لا" },
  numeric: { en: "Numeric", ar: "رقمي" },
  text: { en: "Text", ar: "نصي" },
};

export function ItemTable({ data, onEdit, onDelete, isRtl }: ItemTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-400 dark:text-slate-500">
        {isRtl
          ? "لا توجد بنود مضافة لهذا العنوان"
          : "No items added for this category"}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
            <th className="text-right py-3 px-2 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              #
            </th>
            <th className="text-right py-3 px-2 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              {isRtl ? "اسم البند" : "Item Name"}
            </th>
            <th className="text-center py-3 px-2 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider hidden md:table-cell">
              {isRtl ? "كود سيباهي" : "CBAHI Code"}
            </th>
            <th className="text-center py-3 px-2 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider hidden lg:table-cell">
              {isRtl ? "الخطورة" : "Risk"}
            </th>
            <th className="text-center py-3 px-2 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider hidden xl:table-cell">
              {isRtl ? "نوع الإدخال" : "Input Type"}
            </th>
            <th className="text-center py-3 px-2 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              {isRtl ? "الحالة" : "Status"}
            </th>
            <th className="text-center py-3 px-2 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              {isRtl ? "الإجراءات" : "Actions"}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={item.id}
              className="border-b border-slate-100/50 dark:border-slate-800/50 transition-all duration-200 hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
            >
              <td className="py-3 px-2 text-center text-slate-400 dark:text-slate-500 text-xs">
                {item.sortOrder || index + 1}
              </td>
              <td className="py-3 px-2 font-medium text-slate-700 dark:text-slate-200">
                {isRtl ? item.nameAr || item.name : item.name}
              </td>
              <td className="py-3 px-2 text-center hidden md:table-cell">
                {item.cbahiCode ? (
                  <Badge variant="outline" className="font-mono text-xs border-slate-300 dark:border-slate-700">
                    {item.cbahiCode}
                  </Badge>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600">—</span>
                )}
              </td>
              <td className="py-3 px-2 text-center hidden lg:table-cell">
                <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs", riskLevelMap[item.riskLevel]?.color)}>
                  {isRtl
                    ? riskLevelMap[item.riskLevel]?.label.ar
                    : riskLevelMap[item.riskLevel]?.label.en}
                </Badge>
              </td>
              <td className="py-3 px-2 text-center hidden xl:table-cell">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {isRtl
                    ? inputTypeMap[item.inputType]?.ar
                    : inputTypeMap[item.inputType]?.en}
                </span>
              </td>
              <td className="py-3 px-2 text-center">
                <Badge
                  variant={item.isActive ? "success" : "secondary"}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs",
                    item.isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {item.isActive
                    ? isRtl
                      ? "نشط"
                      : "Active"
                    : isRtl
                    ? "غير نشط"
                    : "Inactive"}
                </Badge>
              </td>
              <td className="py-3 px-2 text-center">
                <div className="flex items-center justify-center gap-1" dir="ltr">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}