// src/app/[locale]/(dashboard)/settings/asset-statuses/AssetStatusTable.tsx
"use client";

import { useState } from "react"; // ✅ إزالة useEffect من الاستيراد
import { useTranslations } from "next-intl";
import {
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssetStatus } from "@/types/assets";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface AssetStatusTableProps {
  data: AssetStatus[];
  onEdit: (status: AssetStatus) => void;
  onDelete: (id: string) => void;
  onReorder?: (items: AssetStatus[]) => void;
  isRtl: boolean;
}

function DraggableRow({
  status,
  index,
  onEdit,
  onDelete,
  isRtl,
}: {
  status: AssetStatus;
  index: number;
  onEdit: (status: AssetStatus) => void;
  onDelete: (id: string) => void;
  isRtl: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const t = useTranslations("AssetStatuses");

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/30",
        isDragging && "shadow-lg ring-2 ring-indigo-400/50"
      )}
    >
      {/* عمود الترتيب مع أيقونة السحب */}
      <td className={cn("py-3 px-4 text-sm", isRtl ? "text-right" : "text-left")}>
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1 rounded"
            title={isRtl ? "سحب للترتيب" : "Drag to reorder"}
          >
            <GripVertical className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </button>
          <span className="text-sm text-slate-400 dark:text-slate-500 font-mono">
            {index + 1}
          </span>
        </div>
      </td>

      {/* الاسم مع اللون */}
      <td className={cn("py-3 px-4 font-medium text-foreground", isRtl ? "text-right" : "text-left")}>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: status.color || "#6B7280" }}
          />
          <span>{isRtl ? status.name : status.nameEn || status.name}</span>
        </div>
      </td>

      {/* الاسم بالإنجليزية */}
      <td className={cn("py-3 px-4 text-sm text-slate-500 dark:text-slate-400", isRtl ? "text-right" : "text-left")}>
        {status.nameEn || "—"}
      </td>

      {/* الافتراضي */}
      <td className="py-3 px-4 text-center">
        {status.isDefault ? (
          <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
        ) : (
          <XCircle className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" />
        )}
      </td>

      {/* النشط */}
      <td className="py-3 px-4 text-center">
        <span
          className={cn(
            "text-sm font-medium",
            status.isActive
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-slate-400 dark:text-slate-500"
          )}
        >
          {status.isActive ? t("active") : t("inactive")}
        </span>
      </td>

      {/* الإجراءات */}
      <td className="py-3 px-4 text-center">
        <div className={cn("flex items-center gap-1", isRtl ? "justify-start" : "justify-end")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(status)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(status.id)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function AssetStatusTable({
  data,
  onEdit,
  onDelete,
  onReorder,
  isRtl,
}: AssetStatusTableProps) {
  const t = useTranslations("AssetStatuses");
  // ✅ حذف useEffect - نترك state مع القيمة الأولية فقط
  const [items, setItems] = useState<AssetStatus[]>(data);

  // ✅ تم حذف useEffect بالكامل

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    onReorder?.(newItems);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
                <th className={cn(
                  "py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider",
                  isRtl ? "text-right" : "text-left"
                )}>
                  {isRtl ? "الترتيب" : "Order"}
                </th>
                <th className={cn(
                  "py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider",
                  isRtl ? "text-right" : "text-left"
                )}>
                  {t("name")}
                </th>
                <th className={cn(
                  "py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider",
                  isRtl ? "text-right" : "text-left"
                )}>
                  {t("nameEn")}
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  {t("default")}
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  {t("active")}
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((status, index) => (
                <DraggableRow
                  key={status.id}
                  status={status}
                  index={index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isRtl={isRtl}
                />
              ))}
            </tbody>
          </table>
        </div>
      </SortableContext>
    </DndContext>
  );
}