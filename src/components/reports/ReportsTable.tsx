"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
} from "@tanstack/react-table";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatDate,
  getStatusColor,
  translateStatus,
} from "@/lib/reports-utils";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ReportsExport } from "./ReportsExport";
import type { Report } from "@/types/report";

interface ReportsTableProps {
  data: Report[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export function ReportsTable({
  data,
  pagination,
  onPageChange,
}: ReportsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = [
    {
      accessorKey: "id",
      header: "المعرف",
      cell: (info: any) => {
        const value = String(info.getValue() ?? "");
        return <span className="font-mono text-sm">#{value}</span>;
      },
    },
    {
      accessorKey: "title",
      header: "عنوان التقرير",
      cell: (info: any) => (
        <span className="font-medium">{String(info.getValue() ?? "")}</span>
      ),
    },
    {
      accessorKey: "category",
      header: "التصنيف",
      cell: (info: any) => {
        const map: Record<string, string> = {
          maintenance: "صيانة",
          inventory: "مخزون",
          vehicles: "مركبات",
          incidents: "حوادث",
          sales: "مبيعات",
        };
        const value = String(info.getValue() ?? "");
        return <span>{map[value] || value}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: (info: any) => {
        const status = String(info.getValue() ?? "");
        return (
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs font-medium border",
              getStatusColor(status)
            )}
          >
            {translateStatus(status)}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "تاريخ الإنشاء",
      cell: (info: any) => {
        return formatDate(String(info.getValue() ?? ""));
      },
    },
  ];

  const table = useReactTable({
    data: data as any[],
    columns: columns as any[],
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          إجمالي: <span className="font-bold text-foreground">{pagination.total}</span>
        </div>
        <ReportsExport data={data} />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
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
              table.getRowModel().rows.map((row: any) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell: any) => (
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