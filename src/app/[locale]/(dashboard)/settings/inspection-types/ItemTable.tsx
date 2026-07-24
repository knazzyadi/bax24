// src/app/[locale]/(dashboard)/settings/inspection-types/ItemTable.tsx
"use client";

import { useState, useEffect } from "react";
import { Edit, Trash2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InspectionItem } from "./types";
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

interface ItemTableProps {
  data: InspectionItem[];
  onEdit: (item: InspectionItem) => void;
  onDelete: (id: string) => void;
  onReorder?: (items: InspectionItem[]) => void;
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

function DraggableRow({
  item,
  index,
  onEdit,
  onDelete,
  isRtl,
}: {
  item: InspectionItem;
  index: number;
  onEdit: (item: InspectionItem) => void;
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
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/30",
        isDragging && "shadow-lg ring-2 ring-indigo-400/50"
      )}
    >
      <td className={cn("py-2 px-3 text-sm", isRtl ? "text-right" : "text-left")}>
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

      <td className={cn("py-2 px-3 font-medium text-foreground text-sm", isRtl ? "text-right" : "text-left")}>
        {isRtl ? item.nameAr || item.name : item.name}
      </td>

      <td className={cn("py-2 px-3 text-sm text-slate-600 dark:text-slate-300 max-w-[150px] truncate", isRtl ? "text-right" : "text-left")}>
        {item.description || "—"}
      </td>

      <td className="py-2 px-3 text-center">
        <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs", riskLevelMap[item.riskLevel]?.color)}>
          {isRtl
            ? riskLevelMap[item.riskLevel]?.label.ar
            : riskLevelMap[item.riskLevel]?.label.en}
        </Badge>
      </td>

      <td className="py-2 px-3 text-center hidden xl:table-cell">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {isRtl
            ? inputTypeMap[item.inputType]?.ar
            : inputTypeMap[item.inputType]?.en}
        </span>
      </td>

      <td className="py-2 px-3 text-center">
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
            ? isRtl ? "نشط" : "Active"
            : isRtl ? "غير نشط" : "Inactive"}
        </Badge>
      </td>

      <td className="py-2 px-3 text-center">
        <div className="flex items-center justify-center gap-1">
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
  );
}

export function ItemTable({ data, onEdit, onDelete, onReorder, isRtl }: ItemTableProps) {
  const [items, setItems] = useState<InspectionItem[]>(data);

  useEffect(() => {
    setItems(data);
  }, [data]);

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

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-400 dark:text-slate-500">
        {isRtl
          ? "لا توجد بنود مضافة لهذه الفئة"
          : "No items added for this category"}
      </div>
    );
  }

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
                <th className={cn("py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider", isRtl ? "text-right" : "text-left")}>
                  {isRtl ? "الترتيب" : "Order"}
                </th>
                <th className={cn("py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider", isRtl ? "text-right" : "text-left")}>
                  {isRtl ? "اسم البند" : "Item Name"}
                </th>
                <th className={cn("py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider", isRtl ? "text-right" : "text-left")}>
                  {isRtl ? "الوصف" : "Description"}
                </th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  {isRtl ? "الخطورة" : "Risk"}
                </th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center hidden xl:table-cell">
                  {isRtl ? "نوع الإدخال" : "Input Type"}
                </th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  {isRtl ? "الحالة" : "Status"}
                </th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  {isRtl ? "الإجراءات" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <DraggableRow
                  key={item.id}
                  item={item}
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