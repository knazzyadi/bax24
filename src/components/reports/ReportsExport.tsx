// components/reports/ReportsExport.tsx
"use client";

import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { formatDate, translateStatus } from "@/lib/reports-utils";

interface ReportsExportProps {
  data: any[];
}

export function ReportsExport({ data }: ReportsExportProps) {
  // تصدير إلى Excel
  const exportToExcel = () => {
    // تحويل البيانات إلى صيغة مناسبة
    const exportData = data.map((item) => ({
      "المعرف": item.id,
      "العنوان": item.title,
      "التصنيف": item.category,
      "الحالة": translateStatus(item.status),
      "التاريخ": formatDate(item.createdAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "التقارير");
    XLSX.writeFile(workbook, `التقارير-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // تصدير إلى CSV (نصي)
  const exportToCSV = () => {
    const headers = ["المعرف", "العنوان", "التصنيف", "الحالة", "التاريخ"];
    const rows = data.map((item) => [
      item.id,
      item.title,
      item.category,
      translateStatus(item.status),
      formatDate(item.createdAt),
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach((row) => {
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `التقارير-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          تصدير
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}