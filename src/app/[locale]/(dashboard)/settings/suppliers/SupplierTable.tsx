// src/app/[locale]/(dashboard)/settings/suppliers/SupplierTable.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Edit,
  Trash2,
  GripVertical,
  Phone,
  Mail,
  MapPin,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Supplier } from "@/types/suppliers";
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
import { Badge } from "@/components/ui/badge";

interface SupplierTableProps {
  data: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
  onReorder?: (items: Supplier[]) => void;
  isRtl: boolean;
}

function DraggableRow({
  supplier,
  index,
  onEdit,
  onDelete,
  isRtl,
}: {
  supplier: Supplier;
  index: number;
  onEdit: (supplier: Supplier) => void;
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
  } = useSortable({ id: supplier.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const t = useTranslations("Suppliers");

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

      {/* الاسم */}
      <td className={cn("py-3 px-4 font-medium text-foreground", isRtl ? "text-right" : "text-left")}>
        {isRtl ? supplier.name : supplier.nameEn || supplier.name}
      </td>

      {/* الاسم بالإنجليزية */}
      <td className={cn("py-3 px-4 text-sm text-slate-500 dark:text-slate-400", isRtl ? "text-right" : "text-left")}>
        {supplier.nameEn || "—"}
      </td>

      {/* المندوب */}
      <td className={cn("py-3 px-4 text-sm text-slate-500 dark:text-slate-400", isRtl ? "text-right" : "text-left")}>
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span>{supplier.contactPerson || "—"}</span>
        </div>
      </td>

      {/* رقم الهاتف */}
      <td className={cn("py-3 px-4 text-sm text-slate-500 dark:text-slate-400", isRtl ? "text-right" : "text-left")}>
        <div className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          <span>{supplier.phone || "—"}</span>
        </div>
      </td>

      {/* البريد الإلكتروني */}
      <td className={cn("py-3 px-4 text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell", isRtl ? "text-right" : "text-left")}>
        <div className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-slate-400" />
          <span className="truncate max-w-[120px]">{supplier.email || "—"}</span>
        </div>
      </td>

      {/* العنوان */}
      <td className={cn("py-3 px-4 text-sm text-slate-500 dark:text-slate-400 hidden lg:table-cell", isRtl ? "text-right" : "text-left")}>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[100px]">{supplier.address || "—"}</span>
        </div>
      </td>

      {/* النشط */}
      <td className="py-3 px-4 text-center">
        <Badge
          variant={supplier.isActive ? "success" : "secondary"}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs",
            supplier.isActive
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-none"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-none"
          )}
        >
          {supplier.isActive ? t("active") : t("inactive")}
        </Badge>
      </td>

      {/* الإجراءات */}
      <td className="py-3 px-4 text-center">
        <div className={cn("flex items-center gap-1", isRtl ? "justify-start" : "justify-end")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(supplier)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(supplier.id)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function SupplierTable({
  data,
  onEdit,
  onDelete,
  onReorder,
  isRtl,
}: SupplierTableProps) {
  const t = useTranslations("Suppliers");
  const [items, setItems] = useState<Supplier[]>(data);

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
                <th className={cn(
                  "py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider",
                  isRtl ? "text-right" : "text-left"
                )}>
                  {t("contactPerson")}
                </th>
                <th className={cn(
                  "py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider",
                  isRtl ? "text-right" : "text-left"
                )}>
                  {t("phone")}
                </th>
                <th className={cn(
                  "py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell",
                  isRtl ? "text-right" : "text-left"
                )}>
                  {t("email")}
                </th>
                <th className={cn(
                  "py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell",
                  isRtl ? "text-right" : "text-left"
                )}>
                  {t("address")}
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  {t("status")}
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((supplier, index) => (
                <DraggableRow
                  key={supplier.id}
                  supplier={supplier}
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