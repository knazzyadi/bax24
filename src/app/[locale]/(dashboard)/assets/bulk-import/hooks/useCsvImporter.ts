import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { AssetRowSchema, BulkAssetRow } from '../types/bulkImport.types';
import { generateId } from '../utils/generateId';

// ✅ دالة ذكية لتحويل التواريخ من أي صيغة إلى YYYY-MM-DD
function parseDate(value: string): string {
  if (!value || value.trim() === '') return '';

  // إذا كان بصيغة YYYY-MM-DD (جاهز)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }

  // محاولة تحويل الصيغ المختلفة (مثل DD/MM/YYYY أو MM/DD/YYYY)
  const parts = value.trim().split(/[\/\-.]/);
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    
    // إذا كان اليوم > 12، فهي بالتأكيد DD/MM/YYYY
    if (d > 12) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    // إذا كان الشهر > 12، فهي MM/DD/YYYY خاطئة، نحاول التصحيح كـ DD/MM
    if (m > 12) {
      return `${y}-${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}`;
    }
    // بشكل افتراضي، نعتبره DD/MM/YYYY (الأكثر شيوعاً في المنطقة العربية)
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // محاولة أخيرة عبر new Date (كحل احتياطي)
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return ''; // فشل التحويل
}

export function useCsvImporter(onSuccess: (rows: BulkAssetRow[]) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processCSVFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);

      try {
        // ✅ الخطوة 1: قراءة الملف كـ ArrayBuffer لحل مشكلة الترميز
        const buffer = await file.arrayBuffer();
        
        // ✅ الخطوة 2: محاولة فك الترميز بـ UTF-8 أولاً، فإن ظهرت أحرف مشوشة نستخدم Windows-1256
        let text = '';
        try {
          // UTF-8
          text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
          // فحص سريع: إذا احتوى النص على علامات استفهام كثيرة أو أحرف غير عربية، قد يكون الترميز مختلفاً
          // (نترك Papa.parse يتعامل مع البقية)
        } catch {
          // فشل UTF-8، نستخدم Windows-1256 (المستخدم عربياً)
          text = new TextDecoder('windows-1256').decode(buffer);
        }

        // ✅ الخطوة 3: تحليل النص باستخدام Papa (بدون تمرير الملف مباشرة)
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rawData = results.data as any[];
            const validatedRows: BulkAssetRow[] = [];
            const errors: string[] = [];

            rawData.forEach((row, idx) => {
              // ✅ الخطوة 4: تطبيع التواريخ باستخدام الدالة الجديدة
              const normalizedRow = { ...row };
              const dateFields = ['purchaseDate', 'warrantyEnd', 'lastMaintenanceDate'];
              for (const field of dateFields) {
                if (normalizedRow[field]) {
                  normalizedRow[field] = parseDate(normalizedRow[field].toString());
                }
              }

              // ✅ الخطوة 5: التحقق من الصحة (مع ملاحظة أن typeId و statusId يجب أن يكونا IDs وليس أسماء)
              const parseResult = AssetRowSchema.safeParse({
                name: normalizedRow.name,
                nameEn: normalizedRow.nameEn,
                typeId: normalizedRow.typeId,
                statusId: normalizedRow.statusId,
                purchaseDate: normalizedRow.purchaseDate,
                warrantyEnd: normalizedRow.warrantyEnd,
                lastMaintenanceDate: normalizedRow.lastMaintenanceDate,
                notes: normalizedRow.notes,
              });
              
              if (parseResult.success) {
                validatedRows.push({
                  id: generateId(),
                  ...parseResult.data,
                });
              } else {
                const zodError = parseResult.error;
                let errorMessage = 'Invalid data';
                
                if ('issues' in zodError && zodError.issues.length > 0) {
                  const issue = zodError.issues[0];
                  const field = issue.path.join('.');
                  errorMessage = field ? `${field}: ${issue.message}` : issue.message;
                } else if ('errors' in zodError && (zodError as any).errors.length > 0) {
                  const err = (zodError as any).errors[0];
                  const field = err.path?.join('.') || '';
                  errorMessage = field ? `${field}: ${err.message}` : err.message;
                }
                
                errors.push(`Row ${idx + 1}: ${errorMessage}`);
              }
            });

            if (validatedRows.length === 0) {
              toast.error('No valid rows found in CSV');
              setError('No valid rows');
            } else {
              toast.success(`Imported ${validatedRows.length} rows (${errors.length} skipped)`);
              if (errors.length > 0) {
                console.warn('CSV validation errors:', errors);
              }
              onSuccess(validatedRows);
            }
            setIsLoading(false);
          },
          error: (err) => {
            toast.error('Failed to parse CSV');
            setError(err.message);
            setIsLoading(false);
          },
        });
      } catch (err: any) {
        toast.error('Failed to read file');
        setError(err.message);
        setIsLoading(false);
      }
    },
    [onSuccess]
  );

  const uploadFile = useCallback(async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [{ description: 'CSV files', accept: { 'text/csv': ['.csv'] } }],
          multiple: false,
        });
        const file = await fileHandle.getFile();
        processCSVFile(file);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast.error('File selection failed');
        }
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) processCSVFile(file);
      };
      input.click();
    }
  }, [processCSVFile]);

  return { uploadFile, isLoading, error };
}