// src/components/shared/DataTable.tsx
"use client";

import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  header?: string;
  title?: string;
  cell?: (item: T, index: number) => React.ReactNode; // ✅ index كمعامل ثانٍ
  render?: (item: T, index: number) => React.ReactNode; // ✅ أيضاً دعم render مع index
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  rowClassName?: string;
  onRowClick?: (item: T) => void;
  rowKey?: keyof T | string;
}

export function DataTable<T>({
  data,
  columns,
  emptyMessage = 'لا توجد بيانات',
  rowClassName,
  onRowClick,
  rowKey = 'id',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
        <p className="text-muted-foreground font-medium">
          {emptyMessage}
        </p>
      </div>
    );
  }
  
  const getRowKey = (item: T, index: number): string => {
    if (rowKey) {
      const value = item[rowKey as keyof T];

      if (value !== undefined && value !== null) {
        return String(value);
      }
    }

    return String(index);
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'p-4 text-right text-sm font-bold text-muted-foreground',
                    col.className
                  )}
                >
                  {col.header || col.title || String(col.key)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((item, index) => (
              <tr
                key={getRowKey(item, index)}
                className={cn(
                  'border-b border-border hover:bg-muted/30 transition-colors',
                  onRowClick && 'cursor-pointer',
                  rowClassName
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn('p-4', col.className)}
                  >
                    {col.cell
                      ? col.cell(item, index)
                      : col.render
                        ? col.render(item, index)
                        : (item[col.key as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}