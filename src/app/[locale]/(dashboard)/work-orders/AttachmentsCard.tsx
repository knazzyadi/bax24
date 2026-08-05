// src/app/[locale]/(dashboard)/work-orders/AttachmentsCard.tsx
"use client";

import { useState, useRef } from "react";
import { Paperclip, X, Upload, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttachmentsCardProps {
  onFilesChange: (files: File[]) => void;
  isRtl: boolean;
}

export function AttachmentsCard({ onFilesChange, isRtl }: AttachmentsCardProps) {
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
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40">
          <Paperclip className="h-5 w-5 text-blue-700 dark:text-blue-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isRtl ? "المرفقات" : "Attachments"}
        </h3>
      </div>

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="w-full justify-start gap-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 h-12 font-medium transition-all"
        >
          <Upload className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
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

        {files.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <File className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1.5 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length === 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {isRtl ? "لم يتم اختيار أي ملف" : "No files selected"}
          </p>
        )}
      </div>
    </div>
  );
}