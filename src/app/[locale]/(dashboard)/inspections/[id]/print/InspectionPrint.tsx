// src/app/[locale]/(dashboard)/inspections/[id]/print/InspectionPrint.tsx
"use client";

import { useEffect } from "react";

interface InspectionPrintProps {
  data: any;
  isRtl: boolean;
  locale: string;
}

export default function InspectionPrint({ data, isRtl }: InspectionPrintProps) {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300);
    const afterPrint = () => window.close();
    window.addEventListener("afterprint", afterPrint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  const reportDate = new Date().toLocaleDateString(isRtl ? "ar" : "en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // حساب الإحصائيات (تعديل المنطق)
  let totalPass = 0,
    totalFail = 0,
    totalNa = 0,
    totalNotEvaluated = 0;
  let totalItems = 0;

  data.categories.forEach((cat: any) => {
    cat.items.forEach((item: any) => {
      totalItems++;
      const result = item.result?.result; // قد يكون undefined
      if (result === "pass") totalPass++;
      else if (result === "fail") totalFail++;
      else if (result === "na") totalNa++;
      else totalNotEvaluated++; // ليس له نتيجة محددة
    });
  });

  // دالة لعرض مستوى الخطورة كنص
  const getRiskLabel = (risk: string) => {
    if (!risk) return "-";
    const labels: Record<string, string> = {
      low: isRtl ? "منخفض" : "Low",
      medium: isRtl ? "متوسط" : "Medium",
      high: isRtl ? "عالي" : "High",
      critical: isRtl ? "حرج" : "Critical",
    };
    return labels[risk] || risk;
  };

  return (
    <div className="min-h-screen bg-white p-8 print:p-0" dir={isRtl ? "rtl" : "ltr"}>
      <style>{`
        @page {
          size: A4 landscape;
          margin: 10mm;
        }

        @media print {
          body {
            background: white !important;
            margin: 0;
            padding: 0;
            font-size: 11px;
          }

          .no-print {
            display: none !important;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
          }

          th,
          td {
            border: 1px solid #000 !important;
            padding: 6px !important;
          }

          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* ===== رأس التقرير ===== */}
      <div className="border-2 border-black p-4 mb-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          {isRtl ? "تقرير التفتيش الفني" : "Inspection Report"}
        </h1>

        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="font-bold">{isRtl ? "رقم التقرير" : "Report"}</td>
              <td>{data.id}</td>
              <td className="font-bold">{isRtl ? "المفتش" : "Inspector"}</td>
              <td>{data.inspector?.name || "-"}</td>
            </tr>
            <tr>
              <td className="font-bold">{isRtl ? "الموقع" : "Location"}</td>
              <td>{data.locationName}</td>
              <td className="font-bold">{isRtl ? "التاريخ" : "Date"}</td>
              <td>{reportDate}</td>
            </tr>
            <tr>
              <td className="font-bold">{isRtl ? "الحالة" : "Status"}</td>
              <td>{data.status}</td>
              <td className="font-bold">{isRtl ? "الشركة" : "Company"}</td>
              <td>{data.company?.name}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===== جداول البنود ===== */}
      {data.categories.map((category: any) => (
        <div key={category.categoryId} className="mb-8">
          <h2 className="text-lg font-semibold bg-gray-100 px-4 py-2 border-b-2 border-gray-300">
            {isRtl ? category.categoryNameAr || category.categoryName : category.categoryName}
          </h2>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-2 text-center">#</th>
                <th className="border border-black p-2 text-right">
                  {isRtl ? "البند" : "Item"}
                </th>
                <th className="border border-black p-2 text-center">
                  {isRtl ? "مطابق" : "Pass"}
                </th>
                <th className="border border-black p-2 text-center">
                  {isRtl ? "غير مطابق" : "Fail"}
                </th>
                <th className="border border-black p-2 text-center">
                  {isRtl ? "لا ينطبق" : "N/A"}
                </th>
                <th className="border border-black p-2 text-center">
                  {isRtl ? "الخطورة" : "Risk"}
                </th>
                <th className="border border-black p-2 text-right">
                  {isRtl ? "الإجراء التصحيحي" : "Action"}
                </th>
                <th className="border border-black p-2 text-right">
                  {isRtl ? "الملاحظات" : "Notes"}
                </th>
              </tr>
            </thead>
            <tbody>
              {category.items.map((item: any, index: number) => {
                const result = item.result?.result; // قد يكون undefined
                return (
                  <tr key={item.id}>
                    <td className="border border-black p-2 text-center">{index + 1}</td>
                    <td className="border border-black p-2">
                      {isRtl ? item.itemNameAr || item.itemName : item.itemName}
                      {item.description && (
                        <div className="text-xs text-gray-500">
                          {isRtl ? item.descriptionAr || item.description : item.description}
                        </div>
                      )}
                    </td>
                    <td className="border border-black p-2 text-center">
                      {result === "pass" ? "☑" : "☐"}
                    </td>
                    <td className="border border-black p-2 text-center">
                      {result === "fail" ? "☑" : "☐"}
                    </td>
                    <td className="border border-black p-2 text-center">
                      {result === "na" ? "☑" : "☐"}
                    </td>
                    <td className="border border-black p-2 text-center">
                      {getRiskLabel(item.riskLevel)}
                    </td>
                    <td className="border border-black p-2">
                      {item.correctiveAction || ""}
                    </td>
                    <td className="border border-black p-2">
                      {item.result?.notes || ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {/* ===== ملخص الإحصائيات ===== */}
      <div className="mt-8 p-4 border-2 border-gray-300 bg-gray-50">
        <h3 className="text-md font-semibold mb-2">{isRtl ? "ملخص التقرير" : "Summary"}</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="font-medium">{isRtl ? "إجمالي البنود:" : "Total Items:"}</span> {totalItems}
          </div>
          <div className="text-green-700">
            <span className="font-medium">{isRtl ? "✔ مطابق:" : "✔ Pass:"}</span> {totalPass}
          </div>
          <div className="text-red-700">
            <span className="font-medium">{isRtl ? "✖ غير مطابق:" : "✖ Fail:"}</span> {totalFail}
          </div>
          <div className="text-gray-600">
            <span className="font-medium">{isRtl ? "○ لا ينطبق:" : "○ N/A:"}</span> {totalNa}
          </div>
          {totalNotEvaluated > 0 && (
            <div className="text-gray-400">
              <span className="font-medium">{isRtl ? "غير مقيم:" : "Not Evaluated:"}</span> {totalNotEvaluated}
            </div>
          )}
        </div>
      </div>

      {/* ===== التوصيات وتاريخ الاستحقاق ===== */}
      {(data.recommendation || data.dueDate) && (
        <div className="mt-8 p-4 border-2 border-gray-300 bg-gray-50">
          <h3 className="text-md font-semibold mb-2">
            {isRtl ? "التوصيات" : "Recommendations"}
          </h3>
          <p className="text-sm whitespace-pre-wrap">{data.recommendation || "-"}</p>
          {data.dueDate && (
            <p className="text-sm mt-2">
              <strong>{isRtl ? "تاريخ الاستحقاق:" : "Due Date:"}</strong>{" "}
              {new Date(data.dueDate).toLocaleDateString(isRtl ? "ar" : "en", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      )}

      {/* ===== التوقيعات ===== */}
      <div className="mt-8 grid grid-cols-2 gap-8 border-t-2 border-gray-300 pt-4">
        <div>
          <p className="text-sm font-medium">{isRtl ? "توقيع المفتش" : "Inspector Signature"}</p>
          <div className="mt-8 border-b border-gray-400 w-3/4"></div>
          <p className="text-xs text-gray-500 mt-1">................</p>
        </div>
        <div>
          <p className="text-sm font-medium">{isRtl ? "توقيع المدير" : "Manager Signature"}</p>
          <div className="mt-8 border-b border-gray-400 w-3/4"></div>
          <p className="text-xs text-gray-500 mt-1">................</p>
        </div>
      </div>

      {/* ===== تذييل التقرير ===== */}
      <div className="mt-12 pt-4 border-t-2 border-gray-300 text-center text-xs text-gray-500">
        <p>{isRtl ? "تم الإنشاء بواسطة نظام إدارة المرافق" : "Generated by Facility Management System"}</p>
        <p className="mt-1">{reportDate}</p>
      </div>
    </div>
  );
}