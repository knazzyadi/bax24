// src/app/[locale]/(dashboard)/assets/bulk-import/components/CsvUploader.tsx
"use client";

import { useRef, useState } from "react";
import { Upload, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CsvUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  error?: string | null;
  isRtl: boolean;
}

export function CsvUploader({ onFileSelect, isLoading, error, isRtl }: CsvUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    e.target.value = "";
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer",
        isDragging
          ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
          : "border-slate-300 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
      )}
      onDrop={handleFileDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      <div className="flex flex-col items-center gap-2">
        <Upload className="h-10 w-10 text-slate-400 dark:text-slate-500" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {isRtl
            ? isLoading ? "جاري الاستيراد..." : "اسحب ملف CSV هنا أو انقر للاختيار"
            : isLoading ? "Importing..." : "Drag & drop CSV file here or click to browse"}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {isRtl ? "يدعم ملفات CSV بصيغة UTF-8" : "Supports UTF-8 CSV files"}
        </p>
      </div>
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}