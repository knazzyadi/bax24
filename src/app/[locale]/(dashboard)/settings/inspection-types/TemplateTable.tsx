// src/app/[locale]/(dashboard)/settings/inspection-types/TemplateTable.tsx
"use client";

import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InspectionTemplate } from "./types";

interface TemplateTableProps {
  data: InspectionTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (template: InspectionTemplate) => void;
  onDelete: (id: string) => void;
  isRtl: boolean;
}

export function TemplateTable({
  data,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  isRtl,
}: TemplateTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-400 dark:text-slate-500">
        {isRtl ? "لا توجد نماذج فحص في هذا القسم" : "No templates in this section"}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
            <th className={cn("py-3 px-2 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider", isRtl ? "text-right" : "text-left")}>
              {isRtl ? "اسم النموذج" : "Template Name"}
            </th>
            <th className={cn("py-3 px-2 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider hidden sm:table-cell", isRtl ? "text-right" : "text-left")}>
              {isRtl ? "الكود" : "Code"}
            </th>
            <th className="text-center py-3 px-2 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              {isRtl ? "الفئات" : "Categories"}
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
          {data.map((template) => (
            <tr
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={cn(
                "cursor-pointer border-b border-slate-100/50 dark:border-slate-800/50 transition-all duration-200 hover:bg-slate-50/70 dark:hover:bg-slate-800/30",
                selectedId === template.id &&
                  "bg-indigo-50/50 dark:bg-indigo-950/20 border-l-4 border-l-indigo-500 dark:border-l-indigo-400"
              )}
            >
              <td className="py-3 px-2 font-medium text-slate-700 dark:text-slate-200">
                {isRtl ? template.nameAr || template.name : template.name}
              </td>
              <td className="py-3 px-2 font-mono text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                {template.code}
              </td>
              <td className="py-3 px-2 text-center">
                <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800">
                  {template._count?.categories || 0}
                </Badge>
              </td>
              <td className="py-3 px-2 text-center">
                <Badge
                  variant={template.isActive ? "success" : "secondary"}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs",
                    template.isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {template.isActive
                    ? isRtl ? "نشط" : "Active"
                    : isRtl ? "غير نشط" : "Inactive"}
                </Badge>
              </td>
              <td className="py-3 px-2 text-center">
                <div className="flex items-center justify-center gap-1" dir="ltr">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg"
                    onClick={(e) => { e.stopPropagation(); onEdit(template); }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                    onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
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