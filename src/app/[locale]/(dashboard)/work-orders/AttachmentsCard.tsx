// src/app/[locale]/(dashboard)/work-orders/shared/AttachmentsCard.tsx
"use client";

import { useState, useRef } from "react";
import { Paperclip, X, Upload, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AttachmentsCardProps {
  onFilesChange: (files: File[]) => void;
  isRtl: boolean;
  t: any;
}

export function AttachmentsCard({ onFilesChange, isRtl, t }: AttachmentsCardProps) {
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      setFiles((prev) => [...prev, ...newFiles]);
      onFilesChange([...files, ...newFiles]);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40">
          <Paperclip className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isRtl ? "المرفقات" : "Attachments"}
        </h3>
      </div>

      <div className="space-y-4">
        {/* زر رفع الملفات */}
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="w-full justify-start gap-2 rounded-xl border-dashed border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-600 dark:text-slate-400 h-12"
        >
          <Upload className="h-4 w-4" />
          {isRtl ? "اختر الملفات" : "Choose files"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt"
        />

        {/* عرض الملفات المختارة */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-700/30"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <File className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            {isRtl ? "لم يتم اختيار أي ملف" : "No files selected"}
          </p>
        )}
      </div>
    </div>
  );
}