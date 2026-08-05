// src/app/[locale]/(dashboard)/super-admin/backups/BackupHistoryTable.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Trash2, RotateCcw } from "lucide-react";
import type { Backup } from "./types";
import { RestoreDialog } from "./RestoreDialog";

interface BackupHistoryTableProps {
  backups?: Backup[];
  refreshTrigger?: number;
  isRtl?: boolean;
}

export function BackupHistoryTable({
  backups: initialBackups,
  refreshTrigger,
  isRtl = false,
}: BackupHistoryTableProps) {
  const t = useTranslations("SuperAdmin.Backups");
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);

  // دالة لجلب النسخ من API باستخدام useCallback
  const fetchBackups = useCallback(async () => {
    if (initialBackups) return;

    setLoading(true);

    try {
      const res = await fetch("/api/admin/company-backups");

      if (!res.ok) {
        throw new Error("Failed to fetch backups");
      }

      const data = await res.json();
      setBackups(data);
    } catch (error) {
      console.error(error);
      toast.error(
        isRtl
          ? "فشل تحميل سجل النسخ"
          : "Failed to load backup history"
      );
    } finally {
      setLoading(false);
    }
  }, [initialBackups, isRtl]);

  // تحميل البيانات عند التغييرات مع تأخير لتجنب تحذير set-state-in-effect
  useEffect(() => {
    if (initialBackups) return;

    const timer = setTimeout(() => {
      void fetchBackups();
    }, 0);

    return () => clearTimeout(timer);
  }, [initialBackups, refreshTrigger, fetchBackups]);

  // استخدم البيانات المبدئية إن وجدت، وإلا استخدم الـ state
  const displayBackups = initialBackups ?? backups;

  const getStatusBadge = (status: Backup["status"]) => {
    const statusStr = typeof status === 'string' ? status : status;
    switch (statusStr) {
      case "COMPLETED":
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-none">{isRtl ? "مكتمل" : "Completed"}</Badge>;
      case "PROCESSING":
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-none">{isRtl ? "قيد المعالجة" : "Processing"}</Badge>;
      case "FAILED":
        return <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-none">{isRtl ? "فشل" : "Failed"}</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd MMM yyyy - HH:mm", {
      locale: isRtl ? ar : undefined,
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleRestoreClick = (backup: Backup) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  const handleRestoreComplete = () => {
    void fetchBackups();
    setRestoreDialogOpen(false);
    setSelectedBackup(null);
  };

  return (
    <>
      <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            {t("history")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : displayBackups.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              {isRtl ? "لا توجد نسخ احتياطية" : "No backups available"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={isRtl ? "text-right" : "text-left"}>
                      {isRtl ? "الشركة" : "Company"}
                    </TableHead>
                    <TableHead className={isRtl ? "text-right" : "text-left"}>
                      {isRtl ? "التاريخ" : "Date"}
                    </TableHead>
                    <TableHead className={isRtl ? "text-right" : "text-left"}>
                      {isRtl ? "الحجم" : "Size"}
                    </TableHead>
                    <TableHead className={isRtl ? "text-right" : "text-left"}>
                      {isRtl ? "الحالة" : "Status"}
                    </TableHead>
                    <TableHead className={isRtl ? "text-right" : "text-left"}>
                      {isRtl ? "الإجراءات" : "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayBackups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">
                        {backup.companyName || backup.company?.name || backup.companyId}
                      </TableCell>
                      <TableCell>{formatDate(backup.createdAt)}</TableCell>
                      <TableCell>{formatFileSize(backup.fileSize ?? undefined)}</TableCell>
                      <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {backup.fileUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                              asChild
                            >
                              <a href={backup.fileUrl} download target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600"
                            onClick={() => handleRestoreClick(backup)}
                            title={isRtl ? "استرجاع" : "Restore"}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RestoreDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        backupId={selectedBackup?.id || ""}
        companyName={selectedBackup?.companyName || selectedBackup?.company?.name || ""}
        onRestoreComplete={handleRestoreComplete}
        isRtl={isRtl}
      />
    </>
  );
}