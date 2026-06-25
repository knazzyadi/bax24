// src/components/reports/ReportsTableAdvanced.tsx
"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, getStatusColor, translateStatus } from "@/lib/reports-utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Report } from "@/types/report";

interface ReportsTableAdvancedProps {
  data: Report[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export function ReportsTableAdvanced({
  data,
  pagination,
  onPageChange,
}: ReportsTableAdvancedProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Report>[] = [
    {
      accessorKey: "id",
      header: "المعرف",
      cell: ({ row }) => <span className="font-mono text-sm">#{row.getValue("id")}</span>,
    },
    {
      accessorKey: "title",
      header: "عنوان التقرير",
      cell: ({ row }) => <span className="font-medium">{row.getValue("title")}</span>,
    },
    {
      accessorKey: "category",
      header: "التصنيف",
      cell: ({ row }) => {
        const map: Record<string, string> = {
          maintenance: "صيانة",
          inventory: "مخزون",
          vehicles: "مركبات",
          incidents: "حوادث",
          sales: "مبيعات",
        };
        return <span>{map[row.getValue("category") as string] || row.getValue("category")}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", getStatusColor(status))}>
            {translateStatus(status)}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "تاريخ الإنشاء",
      cell: ({ row }) => formatDate(row.getValue("createdAt") as string),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        إجمالي: <span className="font-bold text-foreground">{pagination.total}</span>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-1 cursor-pointer select-none",
                          header.column.getCanSort() && "hover:text-foreground"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ChevronUp className="h-4 w-4" />,
                          desc: <ChevronDown className="h-4 w-4" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  لا توجد تقارير
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            صفحة {pagination.page} من {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}