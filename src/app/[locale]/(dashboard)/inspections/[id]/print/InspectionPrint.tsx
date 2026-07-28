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
    // فتح الطباعة تلقائياً بعد تحميل الصفحة
    const timer = setTimeout(() => {
      window.print();
    }, 300);

    // إغلاق النافذة بعد الطباعة أو الإلغاء
    const afterPrint = () => {
      window.close();
    };

    window.addEventListener("afterprint", afterPrint);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isRtl ? "ar" : "en", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getResultLabel = (result: string) => {
    const labels: Record<string, string> = {
      pass: isRtl ? "✔ مطابق" : "✔ Pass",
      fail: isRtl ? "✖ غير مطابق" : "✖ Fail",
      na: isRtl ? "○ لا ينطبق" : "○ N/A",
    };
    return labels[result] || result;
  };

  const reportDate = new Date().toLocaleDateString(isRtl ? "ar" : "en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // حساب الإحصائيات
  let totalPass = 0,
    totalFail = 0,
    totalNa = 0;
  data.categories.forEach((cat: any) => {
    cat.items.forEach((item: any) => {
      const result = item.result?.result || "na";
      if (result === "pass") totalPass++;
      else if (result === "fail") totalFail++;
      else totalNa++;
    });
  });

  return (
    <div className="min-h-screen bg-white p-8 print:p-4" dir={isRtl ? "rtl" : "ltr"}>
      <style>{`
        @media print {
          body { background: white !important; margin: 0; padding: 20px; }
          .no-print { display: none !important; }
          table { page-break-inside: avoid; }
          tr { page-break-inside: avoid; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      {/* رأس التقرير */}
      <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isRtl ? "تقرير التفتيش" : "Inspection Report"}
        </h1>
        {data.company && (
          <p className="text-sm text-gray-600">
            {isRtl ? data.company.name : data.company.nameEn || data.company.name}
          </p>
        )}
        <div className="mt-3 text-sm text-gray-600 space-y-1">
          <p>
            <strong>{isRtl ? "رقم التقرير:" : "Report ID:"}</strong> {data.id}
          </p>
          <p>
            <strong>{isRtl ? "التاريخ:" : "Date:"}</strong> {reportDate}
          </p>
          <p>
            <strong>{isRtl ? "المفتش:" : "Inspector:"}</strong>{" "}
            {data.inspector?.name || "-"}
          </p>
          <p>
            <strong>{isRtl ? "الموقع:" : "Location:"}</strong>{" "}
            {data.locationName || "-"}
          </p>
          <p>
            <strong>{isRtl ? "الحالة:" : "Status:"}</strong>{" "}
            {isRtl
              ? data.status === "completed"
                ? "مكتمل"
                : data.status === "in_progress"
                ? "قيد التنفيذ"
                : "مسودة"
              : data.status}
          </p>
        </div>
      </div>

      {/* محتوى التقرير - جداول لكل فئة */}
      {data.categories.map((category: any) => (
        <div key={category.categoryId} className="mb-8">
          <h2 className="text-lg font-semibold bg-gray-100 px-4 py-2 border-b-2 border-gray-300">
            {isRtl ? category.categoryNameAr || category.categoryName : category.categoryName}
          </h2>
          <table className="w-full border-collapse mt-2">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300">
                <th className="text-left p-2 text-sm font-semibold w-1/3">
                  {isRtl ? "البند" : "Item"}
                </th>
                <th className="text-left p-2 text-sm font-semibold w-1/4">
                  {isRtl ? "النتيجة" : "Result"}
                </th>
                <th className="text-left p-2 text-sm font-semibold w-2/5">
                  {isRtl ? "الملاحظات" : "Notes"}
                </th>
              </tr>
            </thead>
            <tbody>
              {category.items.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="p-2 text-sm">
                    {isRtl ? item.itemNameAr || item.itemName : item.itemName}
                    {item.description && (
                      <div className="text-xs text-gray-500">
                        {isRtl ? item.descriptionAr || item.description : item.description}
                      </div>
                    )}
                  </td>
                  <td className="p-2 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        item.result?.result === "pass"
                          ? "bg-green-100 text-green-700"
                          : item.result?.result === "fail"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {getResultLabel(item.result?.result || "na")}
                    </span>
                  </td>
                  <td className="p-2 text-sm text-gray-600">
                    {item.result?.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* ملخص الإحصائيات */}
      <div className="mt-8 p-4 border-2 border-gray-300 bg-gray-50">
        <h3 className="text-md font-semibold mb-2">
          {isRtl ? "ملخص التقرير" : "Summary"}
        </h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="font-medium">{isRtl ? "إجمالي البنود:" : "Total Items:"}</span>{" "}
            {data.categories.reduce((acc: number, cat: any) => acc + cat.items.length, 0)}
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
        </div>
      </div>

      {/* التوقيعات */}
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

      {/* تذييل التقرير */}
      <div className="mt-12 pt-4 border-t-2 border-gray-300 text-center text-xs text-gray-500">
        <p>{isRtl ? "تم الإنشاء بواسطة نظام إدارة المرافق" : "Generated by Facility Management System"}</p>
        <p className="mt-1">{reportDate}</p>
      </div>
    </div>
  );
}