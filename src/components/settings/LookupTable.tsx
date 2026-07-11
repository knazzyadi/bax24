"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  Inbox,
} from "lucide-react";

import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { LookupFeatures, LookupItem } from "./types";
import { sortLookupItems } from "./utils";
import { StatusBadge } from "./StatusBadge";
import { ColorBadge } from "./ColorBadge";
import { useLocale } from "next-intl";

interface LookupTableProps {
  items: LookupItem[];
  features: LookupFeatures;
  isLoading?: boolean;
  onEdit: (item: LookupItem) => void;
  onDelete: (item: LookupItem) => void;
  onReorder?: (items: LookupItem[]) => void;
  rowClassName?: (item: LookupItem) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  loadingRows?: number;
}

interface SortableRowProps {
  item: LookupItem;
  features: LookupFeatures;
  onEdit: (item: LookupItem) => void;
  onDelete: (item: LookupItem) => void;
  rowClassName?: (item: LookupItem) => string;
}

const SortableRow = memo(function SortableRow({
  item,
  features,
  onEdit,
  onDelete,
  rowClassName,
}: SortableRowProps) {
  const t = useTranslations("Settings");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={rowClassName?.(item)}
      {...attributes}
    >
      {/* Drag Handle */}
      {features.enableSorting && (
        <TableCell className="w-10 align-middle">
          <button
            type="button"
            {...listeners}
            aria-label={t("drag")}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </TableCell>
      )}

      {/* Arabic Name */}
      <TableCell className="font-medium align-middle">{item.name}</TableCell>

      {/* English Name */}
      {features.enableEnglishName && (
        <TableCell className="text-muted-foreground align-middle">
          {item.nameEn || "—"}
        </TableCell>
      )}

      {/* Code */}
      {features.enableCode && (
        <TableCell className="align-middle">
          <Badge variant="outline" className="font-mono">
            {item.code || "—"}
          </Badge>
        </TableCell>
      )}

      {/* Color */}
      {features.enableColor && (
        <TableCell className="align-middle">
          <ColorBadge color={item.color ?? "#64748B"} />
        </TableCell>
      )}

      {/* Order */}
      <TableCell className="text-center align-middle">{item.order}</TableCell>

      {/* Default */}
      {features.enableDefault && (
        <TableCell className="text-center align-middle">
          {item.isDefault ? (
            <StatusBadge label={t("default")} variant="primary" />
          ) : (
            "—"
          )}
        </TableCell>
      )}

      {/* Active Status */}
      {features.enableActive && (
        <TableCell className="align-middle">
          <StatusBadge
            label={item.isActive ? t("active") : t("inactive")}
            variant={item.isActive ? "success" : "secondary"}
          />
        </TableCell>
      )}

      {/* Actions */}
      <TableCell className="text-end align-middle">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={isDragging}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Pencil className="me-2 h-4 w-4" />
              {t("edit")}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

SortableRow.displayName = "SortableRow";

export function LookupTable({
  items,
  features,
  onEdit,
  onDelete,
  onReorder,
  isLoading = false,
  rowClassName,
  emptyTitle,
  emptyDescription,
  loadingRows = 6,
}: LookupTableProps) {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [rows, setRows] = useState<LookupItem[]>([]);

  useEffect(() => {
    setRows(sortLookupItems(items));
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortableIds = useMemo(() => rows.map((item) => item.id), [rows]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) return;
      if (active.id === over.id) return;

      const oldIndex = rows.findIndex((item) => item.id === active.id);
      const newIndex = rows.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(rows, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          order: index + 1,
        })
      );

      setRows(reordered);
      onReorder?.(reordered);
    },
    [rows, onReorder]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-xl border bg-card p-4">
        {Array.from({ length: loadingRows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Empty state
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16">
        <Inbox className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">
          {emptyTitle ?? t("noRecords")}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {emptyDescription ?? t("noRecordsDescription")}
        </p>
      </div>
    );
  }

  const tableContent = (
    <Table>
      <TableHeader>
        <TableRow
          className="
            hover:bg-indigo-50/40
            dark:hover:bg-indigo-950/20
            transition-all
          "
        >
          {features.enableSorting && (
            <TableHead className="w-10 text-start" />
          )}

          <TableHead className="text-start">
            {t("arabicName")}
          </TableHead>

          {features.enableEnglishName && (
            <TableHead className="text-start">
              {t("englishName")}
            </TableHead>
          )}

          {features.enableCode && (
            <TableHead className="text-start">
              {t("code")}
            </TableHead>
          )}

          {features.enableColor && (
            <TableHead className="text-start">
              {t("color")}
            </TableHead>
          )}

          <TableHead className="text-center">
            {t("order")}
          </TableHead>

          {features.enableDefault && (
            <TableHead className="text-center">
              {t("default")}
            </TableHead>
          )}

          {features.enableActive && (
            <TableHead className="text-start">
              {t("status")}
            </TableHead>
          )}

          <TableHead className="text-end">
            {t("actions")}
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((item) => (
          <SortableRow
            key={item.id}
            item={item}
            features={features}
            onEdit={onEdit}
            onDelete={onDelete}
            rowClassName={rowClassName}
          />
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div
    className="
    overflow-x-auto
    rounded-2xl
    border
    border-slate-200/50
    dark:border-slate-800/50
    bg-white/60
    dark:bg-slate-900/60
    backdrop-blur-sm
    shadow-sm
    "
    >
      {features.enableSorting ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            {tableContent}
          </SortableContext>
        </DndContext>
      ) : (
        tableContent
      )}
    </div>
  );
}