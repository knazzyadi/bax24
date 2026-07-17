// src/components/public-ticket/ImageUploadSection.tsx
"use client";

import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface ImageUploadSectionProps {
  files: File[];
  previews: string[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  isRtl: boolean;
  disabled: boolean;
}

export function ImageUploadSection({
  files,
  previews,
  onAddFiles,
  onRemoveFile,
  isRtl,
  disabled,
}: ImageUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length && typeof onAddFiles === "function") {
      onAddFiles(selected);
    } else {
      console.error("onAddFiles is not a function", onAddFiles);
    }
    e.target.value = "";
  };

  return (
    <div>
      <Label className="text-base font-semibold mb-2 block">
        {isRtl ? "صور توضيحية (اختياري)" : "Images (Optional)"}
      </Label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="w-full justify-center gap-2 rounded-full border-primary text-primary hover:bg-primary/10 font-medium"
      >
        <Upload size={18} />
        {isRtl ? "اختر الصور" : "Choose Images"}
      </Button>
      {files.length > 0 && (
        <p className="text-sm text-muted-foreground mt-2">
          {isRtl ? `تم اختيار ${files.length} صورة` : `${files.length} image(s) selected`}
        </p>
      )}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          {previews.map((src, idx) => (
            <div key={idx} className="relative group">
              <img
                src={src}
                alt="preview"
                className="w-full h-24 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => onRemoveFile(idx)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                disabled={disabled}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}