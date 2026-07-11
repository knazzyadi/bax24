// src/app/[locale]/(dashboard)/assets/bulk-import/hooks/useCsvImporter.ts
import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { AssetRowSchema, BulkAssetRow } from '../types/bulkImport.types';
import { generateId } from '../utils/generateId';

// دالة ذكية لتحويل التواريخ (نفس السابق)
function parseDate(value: string): string {
  if (!value || value.trim() === '') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
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

export function useCsvImporter(onSuccess: (rows: BulkAssetRow[]) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ دالة معالجة الملف (تُستخدم مباشرة عند اختيار ملف)
  const processCSVFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);

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
            const rawData = results.data as any[];
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

              // ✅ استخدام AssetRowSchema (المُحدَّث)
              const parseResult = AssetRowSchema.safeParse({
                name: normalizedRow.name,
                nameEn: normalizedRow.nameEn,
                description: normalizedRow.description,
                typeId: normalizedRow.typeId || normalizedRow.type, // دعم type أو typeId
                statusId: normalizedRow.statusId || normalizedRow.status, // دعم status أو statusId
                purchaseDate: normalizedRow.purchaseDate,
                operationDate: normalizedRow.operationDate,
                warrantyEnd: normalizedRow.warrantyEnd,
                lastMaintenanceDate: normalizedRow.lastMaintenanceDate,
                serialNumber: normalizedRow.serialNumber,
                manufacturer: normalizedRow.manufacturer,
                model: normalizedRow.model,
                supplier: normalizedRow.supplier,
                notes: normalizedRow.notes,
              });

              if (parseResult.success) {
                validatedRows.push({
                  id: generateId(),
                  ...parseResult.data,
                });
              } else {
                const zodError = parseResult.error;
                let errorMessage = 'بيانات غير صالحة';
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
          error: (err: any) => {
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

  // ✅ دالة رفع الملف (تفتح نافذة اختيار الملف وتستخدم processCSVFile)
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

  // ✅ إرجاع processCSVFile أيضاً للاستخدام المباشر
  return { uploadFile, processCSVFile, isLoading, error };
}