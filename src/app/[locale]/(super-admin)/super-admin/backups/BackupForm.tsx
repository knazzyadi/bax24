// src/app/[locale]/(dashboard)/super-admin/backups/BackupForm.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Database, Download } from "lucide-react";
import type { Backup, Company } from "./types";

interface BackupFormProps {
  companies?: Company[];
  onBackupCreated?: (backup: Backup) => void;
  isRtl?: boolean;
  locale?: string;
}

export function BackupForm({
  companies = [],
  onBackupCreated,
  isRtl = false,
  locale = "en",
}: BackupFormProps) {
  const t = useTranslations("SuperAdmin.Backups");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [backupType, setBackupType] = useState<"full" | "config">("full");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const rtl = isRtl || locale === "ar";

  const handleSubmit = async () => {
    if (!selectedCompanyId) {
      toast.error(rtl ? "يرجى اختيار شركة" : "Please select a company");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/company-backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          type: backupType,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create backup");
      }

      const newBackup = await res.json();
      toast.success(rtl ? "تم إنشاء النسخة الاحتياطية بنجاح" : "Backup created successfully");

      if (onBackupCreated) {
        onBackupCreated(newBackup);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : rtl
            ? "فشل إنشاء النسخة"
            : "Failed to create backup";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Database className="h-5 w-5 text-indigo-500" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* اختيار الشركة */}
        <div className="space-y-2">
          <Label htmlFor="company">{t("selectCompany")}</Label>
          <Select
            value={selectedCompanyId}
            onValueChange={setSelectedCompanyId}
            open={isSelectOpen}
            onOpenChange={setIsSelectOpen}
          >
            <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-slate-700">
              <SelectValue
                placeholder={rtl ? "اختر شركة" : "Select a company"}
              />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4} className="z-[100]">
              {(companies ?? []).map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* نوع النسخة */}
        <div className="space-y-2">
          <Label>{t("backupType")}</Label>
          <Select
            value={backupType}
            onValueChange={(v) => setBackupType(v as "full" | "config")}
          >
            <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-slate-700">
              <SelectValue placeholder={rtl ? "اختر نوع النسخة" : "Select backup type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">{t("fullBackup")}</SelectItem>
              <SelectItem value="config">{t("configOnly")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* زر الإنشاء */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedCompanyId}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-11 shadow-lg shadow-indigo-500/20"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Download className="h-5 w-5 mr-2" />
          )}
          {t("createBackup")}
        </Button>
      </CardContent>
    </Card>
  );
}