"use client";

import { useEffect } from "react";

interface WorkOrderPrintProps {
  data: any;
  isRtl: boolean;
  locale: string;
}

export function WorkOrderPrint({ data, isRtl, locale }: WorkOrderPrintProps) {
  useEffect(() => {
    // إضافة كلاس printing إلى body
    document.body.classList.add("printing");

    const timer = setTimeout(() => {
      if (document.fonts) {
        document.fonts.ready.then(() => {
          window.print();
        });
      } else {
        window.print();
      }
    }, 300);

    window.onafterprint = () => {
      document.body.classList.remove("printing");
      window.close();
    };

    return () => {
      clearTimeout(timer);
      window.onafterprint = null;
      document.body.classList.remove("printing");
    };
  }, []);

  const getTypeLabel = (type: string) => {
    const types: Record<string, { ar: string; en: string }> = {
      MAINTENANCE: { ar: "صيانة", en: "Maintenance" },
      CORRECTIVE: { ar: "إصلاح", en: "Corrective" },
      EMERGENCY: { ar: "طوارئ", en: "Emergency" },
      BULK_PREVENTIVE: { ar: "وقائية مجمعة", en: "Bulk Preventive" },
    };
    return isRtl ? types[type]?.ar : types[type]?.en;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isRtl ? "ar-SA" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLocation = () => {
    const room = data.room;
    if (!room) return "—";
    const floor = room.floor;
    const building = floor?.building;
    const parts = [];
    if (building) parts.push(isRtl ? building.name : building.nameEn || building.name);
    if (floor) parts.push(isRtl ? floor.name : floor.nameEn || floor.name);
    parts.push(isRtl ? room.name : room.nameEn || room.name);
    return parts.join(" - ");
  };

  return (
    <div
      id="print-area"
      className="print-area w-full max-w-4xl mx-auto bg-white min-h-screen"
      style={{
        fontFamily: "'Times New Roman', serif",
        color: "#000000",
        backgroundColor: "#ffffff",
        padding: "1cm",
      }}
    >
      {/* ========== الرأس ========== */}
      <div className="border-b-2 border-gray-300 pb-4 mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#000000" }}>
            {isRtl ? data.company?.name : data.company?.nameEn || data.company?.name || "BAX24"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#555555" }}>
            {isRtl ? "تقرير أمر عمل" : "Work Order Report"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: "#000000" }}>
            {data.code}
          </div>
          <div className="text-sm mt-1" style={{ color: "#555555" }}>
            {isRtl ? "تاريخ الإنشاء" : "Created"}: {formatDate(data.createdAt)}
          </div>
        </div>
      </div>

      {/* ========== المعلومات الأساسية ========== */}
      <div className="mb-4">
        <h2 className="text-lg font-bold border-b-2 border-gray-300 pb-2 mb-4" style={{ color: "#000000" }}>
          {isRtl ? "المعلومات الأساسية" : "Basic Information"}
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <span className="font-semibold" style={{ color: "#555555" }}>{isRtl ? "العنوان" : "Title"}:</span>
            <span className="ml-2" style={{ color: "#000000" }}>{data.title}</span>
          </div>
          <div>
            <span className="font-semibold" style={{ color: "#555555" }}>{isRtl ? "النوع" : "Type"}:</span>
            <span className="ml-2" style={{ color: "#000000" }}>{getTypeLabel(data.type)}</span>
          </div>
          <div>
            <span className="font-semibold" style={{ color: "#555555" }}>{isRtl ? "الأولوية" : "Priority"}:</span>
            <span className="ml-2" style={{ color: "#000000" }}>
              {isRtl ? data.priority?.name : data.priority?.nameEn || data.priority?.name}
            </span>
          </div>
          <div>
            <span className="font-semibold" style={{ color: "#555555" }}>{isRtl ? "الحالة" : "Status"}:</span>
            <span className="ml-2" style={{ color: "#000000" }}>
              {isRtl ? data.status?.name : data.status?.nameEn || data.status?.name}
            </span>
          </div>
          <div>
            <span className="font-semibold" style={{ color: "#555555" }}>{isRtl ? "المنشئ" : "Created By"}:</span>
            <span className="ml-2" style={{ color: "#000000" }}>{data.createdBy?.name || "—"}</span>
          </div>
          <div>
            <span className="font-semibold" style={{ color: "#555555" }}>{isRtl ? "المسند إليه" : "Assigned To"}:</span>
            <span className="ml-2" style={{ color: "#000000" }}>{data.assignedTo?.name || "—"}</span>
          </div>
          {data.source && (
            <div className="col-span-2">
              <span className="font-semibold" style={{ color: "#555555" }}>{isRtl ? "المصدر" : "Source"}:</span>
              <span className="ml-2" style={{ color: "#000000" }}>
                {data.source === "ticket" && (isRtl ? "بلاغ" : "Ticket")}
                {data.source === "pm" && (isRtl ? "صيانة وقائية" : "Preventive Maintenance")}
                {data.source === "checklist" && (isRtl ? "قائمة فحص" : "Checklist")}
                {data.source === "manual" && (isRtl ? "إنشاء مباشر" : "Manual")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========== الموقع ========== */}
      <div className="mb-4">
        <h2 className="text-lg font-bold border-b-2 border-gray-300 pb-2 mb-4" style={{ color: "#000000" }}>
          {isRtl ? "الموقع" : "Location"}
        </h2>
        <div className="text-sm">
          <span className="font-semibold" style={{ color: "#555555" }}>{isRtl ? "الموقع" : "Location"}:</span>
          <span className="ml-2" style={{ color: "#000000" }}>{getLocation()}</span>
        </div>
        {data.branch && (
          <div className="text-sm mt-1">
            <span className="font-semibold" style={{ color: "#555555" }}>{isRtl ? "الفرع" : "Branch"}:</span>
            <span className="ml-2" style={{ color: "#000000" }}>
              {isRtl ? data.branch.name : data.branch.nameEn || data.branch.name}
            </span>
          </div>
        )}
      </div>

      {/* ========== الأصول ========== */}
      {data.workOrderAssets && data.workOrderAssets.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-bold border-b-2 border-gray-300 pb-2 mb-4" style={{ color: "#000000" }}>
            {isRtl ? "الأصول المرتبطة" : "Associated Assets"}
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left" style={{ color: "#000000" }}>
                  {isRtl ? "الكود" : "Code"}
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left" style={{ color: "#000000" }}>
                  {isRtl ? "الاسم" : "Name"}
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left" style={{ color: "#000000" }}>
                  {isRtl ? "الحالة" : "Status"}
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left" style={{ color: "#000000" }}>
                  {isRtl ? "ملاحظات" : "Notes"}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.workOrderAssets.map((woa: any) => (
                <tr key={woa.assetId}>
                  <td className="border border-gray-300 px-4 py-2 font-mono text-xs" style={{ color: "#000000" }}>
                    {woa.asset.code}
                  </td>
                  <td className="border border-gray-300 px-4 py-2" style={{ color: "#000000" }}>
                    {isRtl ? woa.asset.name : woa.asset.nameEn || woa.asset.name}
                  </td>
                  <td className="border border-gray-300 px-4 py-2" style={{ color: "#000000" }}>
                    {woa.completedAt ? (isRtl ? "مكتمل" : "Completed") : (isRtl ? "قيد الانتظار" : "Pending")}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-xs" style={{ color: "#555555" }}>
                    {woa.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========== الوصف ========== */}
      {data.description && (
        <div className="mb-4">
          <h2 className="text-lg font-bold border-b-2 border-gray-300 pb-2 mb-4" style={{ color: "#000000" }}>
            {isRtl ? "الوصف" : "Description"}
          </h2>
          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#000000" }}>
            {data.description}
          </div>
        </div>
      )}

      {/* ========== الملاحظات ========== */}
      {data.notes && (
        <div className="mb-4">
          <h2 className="text-lg font-bold border-b-2 border-gray-300 pb-2 mb-4" style={{ color: "#000000" }}>
            {isRtl ? "الملاحظات" : "Notes"}
          </h2>
          <div className="text-sm whitespace-pre-wrap" style={{ color: "#000000" }}>
            {data.notes}
          </div>
        </div>
      )}

      {/* ========== سجل التنفيذ ========== */}
      <div className="mb-4">
        <h2 className="text-lg font-bold border-b-2 border-gray-300 pb-2 mb-4" style={{ color: "#000000" }}>
          {isRtl ? "سجل التنفيذ" : "Execution Log"}
        </h2>
        <p className="text-sm" style={{ color: "#555555" }}>
          {isRtl ? "لا توجد سجلات تنفيذ متاحة" : "No execution logs available"}
        </p>
      </div>

      {/* ========== التوقيعات ========== */}
      <div className="border-t border-gray-300 pt-4 mt-4">
        <div className="grid grid-cols-3 gap-8 text-sm mt-4">
          <div>
            <div className="font-semibold" style={{ color: "#555555" }}>{isRtl ? "أعد بواسطة" : "Prepared by"}</div>
            <div className="mt-1 border-b border-gray-400 pb-1 min-h-[2rem]" style={{ color: "#000000" }}>
              {data.createdBy?.name || "__________________"}
            </div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: "#555555" }}>{isRtl ? "راجع بواسطة" : "Reviewed by"}</div>
            <div className="mt-1 border-b border-gray-400 pb-1 min-h-[2rem]" style={{ color: "#000000" }}>
              __________________
            </div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: "#555555" }}>{isRtl ? "نفذ بواسطة" : "Completed by"}</div>
            <div className="mt-1 border-b border-gray-400 pb-1 min-h-[2rem]" style={{ color: "#000000" }}>
              __________________
            </div>
          </div>
        </div>
      </div>

      {/* ========== التذييل ========== */}
      <div className="border-t border-gray-300 mt-6 pt-3 text-xs flex justify-between items-center">
        <span style={{ color: "#555555" }}>{isRtl ? "تم الإنشاء بواسطة BAX24" : "Generated by BAX24"}</span>
        <span style={{ color: "#555555" }}>{isRtl ? "تاريخ الطباعة" : "Printed"}: {formatDate(new Date().toISOString())}</span>
        <span style={{ color: "#555555" }}>{isRtl ? "الصفحة" : "Page"} 1 / 1</span>
      </div>

      {/* ========== أنماط الطباعة ========== */}
      <style jsx global>{`
        /* عند إضافة كلاس printing إلى الـ body */
        body.printing {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
        }

        /* ✅ إخفاء كل عناصر الداشبورد */
        body.printing aside,
        body.printing header,
        body.printing nav,
        body.printing footer,
        body.printing [role="navigation"],
        body.printing [role="banner"],
        body.printing [data-sidebar],
        body.printing [data-slot="sidebar"],
        body.printing [data-slot="header"],
        body.printing [data-slot="breadcrumb"],
        body.printing .sidebar,
        body.printing .topbar,
        body.printing .navbar,
        body.printing .no-print {
          display: none !important;
        }

        /* ✅ إخفاء جميع عناصر #__next مباشرةً، مع إبقاء #print-area ظاهرة */
        body.printing #__next > *:not(#print-area) {
          display: none !important;
        }

        /* ✅ تأكد من ظهور #print-area */
        body.printing #print-area {
          display: block !important;
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 18mm !important;
          background: white !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          visibility: visible !important;
          z-index: 9999 !important;
        }

        body.printing #print-area * {
          visibility: visible !important;
          color: #000000 !important;
          background-color: transparent !important;
        }

        body.printing #print-area .border-gray-300 {
          border-color: #cccccc !important;
        }

        body.printing #print-area .bg-gray-100 {
          background-color: #f5f5f5 !important;
        }

        body.printing #print-area .bg-white {
          background-color: white !important;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          body * {
            visibility: hidden !important;
          }

          #print-area,
          #print-area * {
            visibility: visible !important;
          }

          #print-area {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 18mm !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          #print-area * {
            color: #000000 !important;
            background-color: transparent !important;
          }

          #print-area .border-gray-300 {
            border-color: #cccccc !important;
          }

          #print-area .bg-gray-100 {
            background-color: #f5f5f5 !important;
          }

          #print-area .bg-white {
            background-color: white !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </div>
  );
}