// src/app/[locale]/(dashboard)/assets/bulk-import/constants/tableColumns.ts
export interface Column {
  key: string;
  labelRtl: string;
  labelEn: string;
  required?: boolean;
  width?: string;
}

export const TABLE_COLUMNS: Column[] = [
  { key: "#", labelRtl: "#", labelEn: "#", width: "min-w-[40px]" },
  { key: "name", labelRtl: "الاسم", labelEn: "Name", required: true, width: "min-w-[120px]" },
  { key: "nameEn", labelRtl: "الاسم (إنجليزي)", labelEn: "Name (EN)", width: "min-w-[120px]" },
  { key: "description", labelRtl: "الوصف", labelEn: "Description", width: "min-w-[120px]" },
  { key: "typeId", labelRtl: "النوع", labelEn: "Type", required: true, width: "min-w-[140px]" },
  { key: "statusId", labelRtl: "الحالة", labelEn: "Status", width: "min-w-[140px]" },
  { key: "purchaseDate", labelRtl: "تاريخ الشراء", labelEn: "Purchase Date", width: "min-w-[120px]" },
  { key: "operationDate", labelRtl: "تاريخ التشغيل", labelEn: "Operation Date", width: "min-w-[120px]" },
  { key: "warrantyEnd", labelRtl: "انتهاء الضمان", labelEn: "Warranty End", width: "min-w-[120px]" },
  { key: "lastMaintenanceDate", labelRtl: "آخر صيانة", labelEn: "Last Maintenance", width: "min-w-[120px]" },
  { key: "serialNumber", labelRtl: "الرقم التسلسلي", labelEn: "Serial Number", width: "min-w-[120px]" },
  { key: "manufacturer", labelRtl: "المصنع", labelEn: "Manufacturer", width: "min-w-[120px]" },
  { key: "model", labelRtl: "الموديل", labelEn: "Model", width: "min-w-[120px]" },
  { key: "supplier", labelRtl: "المورد", labelEn: "Supplier", width: "min-w-[120px]" },
  { key: "notes", labelRtl: "ملاحظات", labelEn: "Notes", width: "min-w-[120px]" },
  { key: "actions", labelRtl: "إجراء", labelEn: "Action", width: "min-w-[60px] text-center" },
];