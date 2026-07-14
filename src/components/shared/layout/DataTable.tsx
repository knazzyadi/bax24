// src/components/shared/layout/DataTable.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DataTableColumn<T> {
  key: keyof T | string;
  title: string;
  className?: string;
  headerClassName?: string;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey?: keyof T | ((row: T) => React.Key);
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = "لا توجد بيانات",
  rowKey = "id",
  onRowClick,
  className,
}: DataTableProps<T>) {
  const getKey = (row: T, index: number): React.Key => {
    if (typeof rowKey === "function") return rowKey(row);
    const value = row[rowKey];
    if (typeof value === "string" || typeof value === "number") return value;
    return index;
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-800/50",
        "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm",
        className
      )}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={cn(
                    "font-semibold text-slate-600 dark:text-slate-300",
                    column.headerClassName
                  )}
                >
                  {column.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  جاري تحميل البيانات...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={getKey(row, index)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-slate-200/30 dark:border-slate-800/30",
                    onRowClick && "cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors"
                  )}
                >
                  {columns.map((column) => (
                    <TableCell key={String(column.key)} className={column.className}>
                      {column.render ? column.render(row) : String(row[column.key as keyof T] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default DataTable;