// src/app/[locale]/(dashboard)/assets/bulk-import/useBulkImport.ts
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import Papa from 'papaparse';
import type { Building, AssetStatus, AssetType } from '@/types/assets';
import { BulkAssetRow } from './bulkImport.types';
import { generateId } from './generateId';

// =======================================================
// الأنواع
// =======================================================

type SubmitError = {
  message: string;
};

type SubmitResult = {
  successCount: number;
  failCount: number;
  errors: SubmitError[];
};

type CsvRow = Record<string, string | undefined>;

type FilePickerWindow = Window & {
  showOpenFilePicker?: (options?: {
    multiple?: boolean;
    types?: {
      description: string;
      accept: Record<string, string[]>;
    }[];
  }) => Promise<FileSystemFileHandle[]>;
};

// =======================================================
// دوال مساعدة
// =======================================================

const normalizeBuilding = (b: Building): Building & { nameEn?: string } => ({
  ...b,
  nameEn: b.nameEn ?? undefined,
});

function parseDate(value: string): string {
  if (!value || value.trim() === "") return "";

  // تحويل الأرقام العربية والهندية إلى أرقام إنجليزية
  const normalized = value
    .trim()
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  // DD/MM/YYYY أو DD-MM-YYYY أو DD.MM.YYYY
  const parts = normalized.split(/[\/.\-]/);

  if (parts.length === 3) {
    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);
    const third = parseInt(parts[2], 10);

    if (
      Number.isNaN(first) ||
      Number.isNaN(second) ||
      Number.isNaN(third)
    ) {
      return "";
    }

    let day: number;
    let month: number;
    let year: number;

    // YYYY-MM-DD
    if (parts[0].length === 4) {
      year = first;
      month = second;
      day = third;
    } else {
      // DD/MM/YYYY
      day = first;
      month = second;
      year = third;

      // MM/DD/YYYY
      if (day <= 12 && month > 12) {
        day = second;
        month = first;
      }
    }

    if (
      year < 1900 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return "";
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  }

  const date = new Date(normalized);

  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }

  return "";
}

// =======================================================
// الهوك الرئيسي
// =======================================================

export function useBulkImport() {
  const router = useRouter();
  const { data: session } = useSession();
  const locale = useLocale();
  const isRtl = locale === 'ar';

  // ---------- الحالة: البيانات الخام ----------
  const [rawBuildings, setRawBuildings] = useState<Building[]>([]);

  // ---------- الحالة: الاختيارات ----------
  const [selectedBuildingId, setSelectedBuildingId] = useState('');

  // ---------- الحالة: مؤشرات التحميل والأخطاء ----------
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [locationFetchError, setLocationFetchError] = useState<string | null>(null);

  // ---------- الحالة: الأنواع والحالات ----------
  const [types, setTypes] = useState<AssetType[]>([]);
  const [statuses, setStatuses] = useState<AssetStatus[]>([]);
  const [loadingTypesStatuses, setLoadingTypesStatuses] = useState(true);

  // ---------- الحالة: صفوف الأصول ----------
  const [rows, setRows] = useState<BulkAssetRow[]>([
    {
      id: generateId(),
      name: '',
      nameEn: '',
      description: '',
      typeId: '',
      statusId: '',
      purchaseDate: '',
      operationDate: '',
      warrantyEnd: '',
      lastMaintenanceDate: '',
      serialNumber: '',
      manufacturer: '',
      model: '',
      supplier: '',
      notes: '',
      floorCode: '',
      roomCode: '',
    },
  ]);

  // ---------- الحالة: CSV ----------
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  // ---------- الحالة: التقديم ----------
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  // =======================================================
  // قيم محسوبة (بدون حالة)
  // =======================================================

  const locationError = !session?.user?.companyId
    ? 'لا توجد شركة مرتبطة بالمستخدم'
    : locationFetchError ?? null;

  // =======================================================
  // قيم مشتقة باستخدام useMemo
  // =======================================================

  const buildings = useMemo(
    () => rawBuildings.map(normalizeBuilding),
    [rawBuildings]
  );

  // =======================================================
  // تأثيرات جلب البيانات
  // =======================================================

  useEffect(() => {
    if (!session?.user?.companyId) return;

    const fetchBuildings = async () => {
      setLoadingBuildings(true);
      setLocationFetchError(null);
      try {
        const res = await fetch(`/api/locations/buildings?companyId=${session.user.companyId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'فشل تحميل المباني');
        }
        const data = await res.json();
        setRawBuildings(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
        setLocationFetchError(message);
        toast.error(message);
        setRawBuildings([]);
      } finally {
        setLoadingBuildings(false);
      }
    };

    fetchBuildings();
  }, [session]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, statusesRes] = await Promise.all([
          fetch(`/api/asset-types?locale=${locale}`),
          fetch(`/api/asset-statuses?locale=${locale}`),
        ]);
        if (typesRes.ok) setTypes(await typesRes.json());
        if (statusesRes.ok) setStatuses(await statusesRes.json());
      } catch {
        toast.error('Failed to load types/statuses');
      } finally {
        setLoadingTypesStatuses(false);
      }
    };
    fetchData();
  }, [locale]);

  // =======================================================
  // دوال الموقع
  // =======================================================

  const handleBuildingChange = (id: string) => {
    setSelectedBuildingId(id);
  };

  // =======================================================
  // دوال صفوف الأصول
  // =======================================================

  const addRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: generateId(),
        floorCode: '',
        roomCode: '',
        name: '',
        nameEn: '',
        description: '',
        typeId: '',
        statusId: '',
        purchaseDate: '',
        operationDate: '',
        warrantyEnd: '',
        lastMaintenanceDate: '',
        serialNumber: '',
        manufacturer: '',
        model: '',
        supplier: '',
        notes: '',
      },
    ]);
  };

  const removeRow = (index: number) => {
    setRows(prev => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateRow = (index: number, field: keyof BulkAssetRow, value: string) => {
    setRows(prev =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  };

  const setRowsFromCSV = (newRows: BulkAssetRow[]) => {
    if (newRows.length) setRows(newRows);
  };

  // =======================================================
  // دوال CSV (تم التعديل هنا)
  // =======================================================

  const processCSVFile = async (file: File) => {
    setCsvLoading(true);
    setCsvError(null);

    try {
      const buffer = await file.arrayBuffer();
      let text = '';
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      } catch {
        text = new TextDecoder('windows-1256').decode(buffer);
      }

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rawData = results.data as CsvRow[];
          const validatedRows: BulkAssetRow[] = [];
          const errors: string[] = [];

          rawData.forEach((row, idx) => {
            const normalizedRow = { ...row };
            const dateFields = ['purchaseDate', 'operationDate', 'warrantyEnd', 'lastMaintenanceDate'];
            for (const field of dateFields) {
              if (normalizedRow[field]) {
                normalizedRow[field] = parseDate(normalizedRow[field].toString());
              }
            }

            const name = normalizedRow.name?.trim() || '';

            // ✅ دعم أسماء الأعمدة المختلفة: typeId, type, typeCode
            const typeValue =
              normalizedRow.typeId?.trim() ||
              normalizedRow.type?.trim() ||
              normalizedRow.typeCode?.trim() ||
              '';

            // ✅ دعم أسماء الأعمدة المختلفة: statusId, status, statusCode
            const statusValue =
              normalizedRow.statusId?.trim() ||
              normalizedRow.status?.trim() ||
              normalizedRow.statusCode?.trim() ||
              '';

            if (name && typeValue) {
              validatedRows.push({
                id: generateId(),

                floorCode:
                  normalizedRow.floorCode?.trim() ||
                  undefined,

                roomCode:
                  normalizedRow.roomCode?.trim() ||
                  undefined,

                name,

                nameEn:
                  normalizedRow.nameEn?.trim() ||
                  '',

                description:
                  normalizedRow.description?.trim() ||
                  '',

                typeId: typeValue,

                statusId: statusValue,

                purchaseDate:
                  normalizedRow.purchaseDate || '',

                operationDate:
                  normalizedRow.operationDate || '',

                warrantyEnd:
                  normalizedRow.warrantyEnd || '',

                lastMaintenanceDate:
                  normalizedRow.lastMaintenanceDate || '',

                serialNumber:
                  normalizedRow.serialNumber?.trim() ||
                  '',

                manufacturer:
                  normalizedRow.manufacturer?.trim() ||
                  '',

                model:
                  normalizedRow.model?.trim() ||
                  '',

                supplier:
                  normalizedRow.supplier?.trim() ||
                  '',

                notes:
                  normalizedRow.notes?.trim() ||
                  '',
              });
            } else {
              errors.push(`Row ${idx + 1}: missing name or type`);
            }
          });

          if (validatedRows.length === 0) {
            toast.error(isRtl ? 'لم يتم العثور على صفوف صالحة في ملف CSV' : 'No valid rows found in CSV');
            setCsvError(isRtl ? 'لا توجد صفوف صالحة' : 'No valid rows');
          } else {
            toast.success(
              isRtl
                ? `تم استيراد ${validatedRows.length} صف (تم تخطي ${errors.length})`
                : `Imported ${validatedRows.length} rows (${errors.length} skipped)`
            );
            if (errors.length > 0) {
              console.warn('CSV validation errors:', errors);
            }
            setRowsFromCSV(validatedRows);
          }
          setCsvLoading(false);
        },
        error: (err: { message: string }) => {
          toast.error(isRtl ? 'فشل تحليل ملف CSV' : 'Failed to parse CSV');
          setCsvError(err.message);
          setCsvLoading(false);
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to read file';
      toast.error(isRtl ? 'فشل قراءة الملف' : 'Failed to read file');
      setCsvError(message);
      setCsvLoading(false);
    }
  };

  const uploadFile = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const pickerWindow = window as FilePickerWindow;
        const [fileHandle] = await pickerWindow.showOpenFilePicker!({
          multiple: false,
          types: [
            {
              description: 'CSV files',
              accept: {
                'text/csv': ['.csv'],
              },
            },
          ],
        });
        const file = await fileHandle.getFile();
        processCSVFile(file);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name !== 'AbortError') {
          toast.error(isRtl ? 'فشل اختيار الملف' : 'File selection failed');
        }
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) processCSVFile(file);
      };
      input.click();
    }
  };

  // =======================================================
  // دالة التقديم
  // =======================================================

  const submit = async () => {
    if (!selectedBuildingId) {
      toast.error(
        isRtl
          ? 'يرجى اختيار المبنى'
          : 'Please select a building'
      );
      return;
    }

    const invalidRows = rows.filter(
      (row) => !row.name.trim() || !row.typeId
    );

    if (invalidRows.length > 0) {
      toast.error(
        isRtl
          ? 'جميع الصفوف يجب أن تحتوي على اسم ونوع'
          : 'All rows must have name and type'
      );
      return;
    }

    const invalidLocationRows = rows.filter(
      (row) =>
        !row.floorCode?.trim() ||
        !row.roomCode?.trim()
    );

    if (invalidLocationRows.length > 0) {
      toast.error(
        isRtl
          ? 'يجب تحديد الدور والغرفة لكل أصل'
          : 'Every asset must have a floor and room'
      );
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    try {
      console.log("===== BULK IMPORT DEBUG =====");
      console.log("selectedBuildingId:", selectedBuildingId);
      console.log("rows:", rows);
      console.log("first floorCode:", rows[0]?.floorCode);
      console.log("first roomCode:", rows[0]?.roomCode);
      console.log("=============================");

      const payload = {
        buildingId: selectedBuildingId,
        assets: rows.map((row) => ({
          name: row.name.trim(),
          nameEn: row.nameEn?.trim() || null,
          description: row.description?.trim() || null,

          floorCode: row.floorCode?.trim() || null,
          roomCode: row.roomCode?.trim() || null,

          typeId: row.typeId,
          statusId: row.statusId || null,

          purchaseDate: row.purchaseDate || null,
          operationDate: row.operationDate || null,
          warrantyEnd: row.warrantyEnd || null,
          lastMaintenanceDate: row.lastMaintenanceDate || null,

          serialNumber: row.serialNumber?.trim() || null,
          manufacturer: row.manufacturer?.trim() || null,
          model: row.model?.trim() || null,
          supplier: row.supplier?.trim() || null,
          notes: row.notes?.trim() || null,
        })),
      };

      const res = await fetch("/api/assets/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitResult({
          successCount: data.successCount || 0,
          failCount: data.failCount || 0,
          errors: data.errors || [],
        });

        toast.success(
          isRtl
            ? `تم استيراد ${data.successCount} أصل بنجاح`
            : `${data.successCount} assets imported successfully`
        );

        if (data.failCount > 0) {
          toast.warning(
            isRtl
              ? `فشل استيراد ${data.failCount} أصل`
              : `${data.failCount} assets failed to import`
          );
        }

        setTimeout(() => {
          router.push(`/${locale}/assets`);
          router.refresh();
        }, 1500);
      } else {
        toast.error(data.error || (isRtl ? 'حدث خطأ أثناء التقديم' : 'Error during submission'));
        setSubmitResult({
          successCount: 0,
          failCount: rows.length,
          errors: [{ message: data.error || 'Unknown error' }],
        });
      }
    } catch {
      toast.error(isRtl ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
      setSubmitResult({
        successCount: 0,
        failCount: rows.length,
        errors: [{ message: 'Connection failed' }],
      });
    } finally {
      setSubmitting(false);
    }
  };

  // =======================================================
  // القيم المُرجعة
  // =======================================================

  const isLoading =
    loadingBuildings ||
    loadingTypesStatuses;

  return {
    location: {
      buildings,
      selectedBuildingId,
      loadingBuildings,
      handleBuildingChange,
    },
    locationError,
    types,
    statuses,
    rows,
    addRow,
    removeRow,
    updateRow,
    csvLoading,
    csvError,
    uploadFile,
    processCSVFile,
    submit,
    submitting,
    submitResult,
    isLoading,
  };
}