// src/components/reports/ReportsExport.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Report } from "@/types/report";

interface ReportsExportProps {
  data: Report[];
}

export function ReportsExport({ data }: ReportsExportProps) {
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((item) => ({
        المعرف: item.id,
        العنوان: item.title,
        التصنيف: item.category,
        الحالة: item.status,
        "تاريخ الإنشاء": item.createdAt,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "التقارير");
    XLSX.writeFile(workbook, "التقارير.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const totalPagesExp = "{total_pages_count_string}";

    autoTable(doc, {
      head: [["المعرف", "العنوان", "التصنيف", "الحالة", "تاريخ الإنشاء"]],
      body: data.map((item) => [
        item.id,
        item.title,
        item.category,
        item.status,
        item.createdAt,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      didDrawPage: function (data) {
        const str = `الصفحة ${doc.getCurrentPageInfo().pageNumber} من ${totalPagesExp}`;
        doc.setFontSize(8);
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      },
    });

    // Save the PDF
    doc.save("التقارير.pdf");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          تصدير
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          تصدير إلى Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-red-600" />
          تصدير إلى PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}