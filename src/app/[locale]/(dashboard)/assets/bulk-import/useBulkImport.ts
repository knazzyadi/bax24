// src/app/[locale]/(dashboard)/assets/bulk-import/useBulkImport.ts
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import Papa from 'papaparse';
import type { Building, Floor, Room, AssetStatus, AssetType } from '@/types/assets';
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

// الغرفة مع الكود الكامل (يُستخدم فقط في القيم المشتقة)
type RoomWithCode = Room & {
  nameEn?: string;
  fullCode: string; // ✅ تمت إضافة fullCode
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

const normalizeFloor = (f: Floor): Floor & { nameEn?: string } => ({
  ...f,
  nameEn: f.nameEn ?? undefined,
});

function parseDate(value: string): string {
  if (!value || value.trim() === '') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
  const parts = value.trim().split(/[\/\-.]/);
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (d > 12) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (m > 12) {
      return `${y}-${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}`;
    }
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return '';
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
  const [rawFloors, setRawFloors] = useState<Floor[]>([]);
  const [rawRooms, setRawRooms] = useState<Room[]>([]); // ✅ تغيير النوع إلى Room[]

  // ---------- الحالة: الاختيارات ----------
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');

  // ---------- الحالة: مؤشرات التحميل والأخطاء ----------
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
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

  const floors = useMemo(() => {
    if (!selectedBuildingId) return [];
    return rawFloors.map(normalizeFloor);
  }, [rawFloors, selectedBuildingId]);

  // الغرف مع fullCode محسوب من المبنى والدور
  const rooms = useMemo((): RoomWithCode[] => {
    if (!selectedFloorId) return [];
    const building = rawBuildings.find(b => b.id === selectedBuildingId);
    const floor = rawFloors.find(f => f.id === selectedFloorId);
    return rawRooms.map((room) => ({
      ...room,
      nameEn: room.nameEn ?? undefined,
      fullCode: `${building?.code ?? ''}-${floor?.code ?? ''}-${room.code ?? ''}`,
    }));
  }, [rawRooms, selectedFloorId, selectedBuildingId, rawBuildings, rawFloors]);

  const selectedRoomCode = useMemo(() => {
    const room = rooms.find(r => r.id === selectedRoomId);
    return room?.fullCode || '';
  }, [rooms, selectedRoomId]);

  const selectedRoomName = useMemo(() => {
    const room = rooms.find(r => r.id === selectedRoomId);
    return room?.name || '';
  }, [rooms, selectedRoomId]);

  // =======================================================
  // تأثيرات جلب البيانات
  // =======================================================

  // جلب المباني
  useEffect(() => {
    if (!session?.user?.companyId) {
      return;
    }

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

  // جلب الأدوار (مع إلغاء الطلب)
  useEffect(() => {
    if (!selectedBuildingId) return;

    let cancelled = false;

    const loadFloors = async () => {
      try {
        setLoadingFloors(true);
        const res = await fetch(`/api/locations/buildings/${selectedBuildingId}/floors`);
        if (!res.ok) {
          throw new Error('فشل تحميل الأدوار');
        }
        const data: Floor[] = await res.json();
        if (!cancelled) {
          setRawFloors(data);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'خطأ غير معروف');
          setRawFloors([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingFloors(false);
        }
      }
    };

    loadFloors();

    return () => {
      cancelled = true;
    };
  }, [selectedBuildingId]);

  // جلب الغرف (مع إلغاء الطلب) - نخزن البيانات الخام بدون fullCode
  useEffect(() => {
    if (!selectedFloorId) return;

    let cancelled = false;

    const loadRooms = async () => {
      try {
        setLoadingRooms(true);
        const res = await fetch(`/api/locations/floors/${selectedFloorId}/rooms`);
        if (!res.ok) {
          throw new Error('فشل تحميل الغرف');
        }
        const data: Room[] = await res.json();
        if (!cancelled) {
          // نخزن البيانات الخام فقط (بدون fullCode)
          setRawRooms(data);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'خطأ غير معروف');
          setRawRooms([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingRooms(false);
        }
      }
    };

    loadRooms();

    return () => {
      cancelled = true;
    };
  }, [selectedFloorId]);

  // جلب الأنواع والحالات
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
    setSelectedFloorId('');
    setSelectedRoomId('');
  };

  const handleFloorChange = (id: string) => {
    setSelectedFloorId(id);
    setSelectedRoomId('');
  };

  const handleRoomChange = (id: string) => {
    setSelectedRoomId(id);
  };

  // =======================================================
  // دوال صفوف الأصول
  // =======================================================

  const addRow = () => {
    setRows(prev => [
      ...prev,
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
  // دوال CSV
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
            const typeId = normalizedRow.typeId || normalizedRow.type || '';
            if (name && typeId) {
              validatedRows.push({
                id: generateId(),
                name,
                nameEn: normalizedRow.nameEn?.trim() || '',
                description: normalizedRow.description?.trim() || '',
                typeId,
                statusId: normalizedRow.statusId || normalizedRow.status || '',
                purchaseDate: normalizedRow.purchaseDate || '',
                operationDate: normalizedRow.operationDate || '',
                warrantyEnd: normalizedRow.warrantyEnd || '',
                lastMaintenanceDate: normalizedRow.lastMaintenanceDate || '',
                serialNumber: normalizedRow.serialNumber?.trim() || '',
                manufacturer: normalizedRow.manufacturer?.trim() || '',
                model: normalizedRow.model?.trim() || '',
                supplier: normalizedRow.supplier?.trim() || '',
                notes: normalizedRow.notes?.trim() || '',
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
    if (!selectedRoomId) {
      toast.error(isRtl ? 'الرجاء اختيار غرفة أولاً' : 'Please select a room first');
      return;
    }

    const invalidRows = rows.filter((row) => !row.name.trim() || !row.typeId);
    if (invalidRows.length > 0) {
      toast.error(isRtl ? 'جميع الصفوف يجب أن تحتوي على اسم ونوع' : 'All rows must have name and type');
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const payload = {
        roomId: selectedRoomId,
        assets: rows.map((row) => ({
          name: row.name.trim(),
          nameEn: row.nameEn?.trim() || null,
          description: row.description?.trim() || null,
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

  const isLoading = loadingBuildings || loadingFloors || loadingRooms || loadingTypesStatuses;

  return {
    location: {
      buildings,
      floors,
      rooms,          // الآن من النوع RoomWithCode[] (يحتوي fullCode)
      selectedBuildingId,
      selectedFloorId,
      selectedRoomId,
      selectedRoomCode,
      selectedRoomName,
      loadingBuildings,
      loadingFloors,
      loadingRooms,
      handleBuildingChange,
      handleFloorChange,
      handleRoomChange,
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