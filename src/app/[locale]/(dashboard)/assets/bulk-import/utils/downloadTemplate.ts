// src/app/[locale]/(dashboard)/assets/bulk-import/utils/downloadTemplate.ts
export function downloadCSVTemplate() {
  const headers = [
    "name",
    "nameEn",
    "description",
    "type",
    "status",
    "purchaseDate",
    "operationDate",
    "warrantyEnd",
    "lastMaintenanceDate",
    "serialNumber",
    "manufacturer",
    "model",
    "supplier",
    "notes",
  ];
  const csvContent = headers.join(",") + "\n";
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "assets_import_template.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}