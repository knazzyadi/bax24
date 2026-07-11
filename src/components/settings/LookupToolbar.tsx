"use client";

import { LucideIcon, Plus } from "lucide-react";
import { useTranslations } from "next-intl"; // ✅ استيراد الترجمة
import { Button } from "@/components/ui/button";
import { LookupSearch } from "./LookupSearch";

interface LookupToolbarProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  addLabel?: string;
  searchPlaceholder?: string;
  total?: number;
}

export function LookupToolbar({
  title,
  description,
  icon: Icon,
  search,
  onSearchChange,
  onAdd,
  addLabel = "Add",
  searchPlaceholder = "Search...",
  total,
}: LookupToolbarProps) {
  const t = useTranslations("Settings"); // ✅ استخدام الترجمة

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="
          relative
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* Background Glow */}
        <div
          className="
            absolute
            inset-0
            -z-10
            rounded-3xl
            bg-gradient-to-r
            from-indigo-100/30
            via-transparent
            to-purple-100/30
            dark:from-indigo-950/20
            dark:via-transparent
            dark:to-purple-950/20
          "
        />

        {/* Title Section */}
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className="
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-br
              from-indigo-500/10
              to-purple-500/10
              dark:from-indigo-500/20
              dark:to-purple-500/20
              border
              border-indigo-200/30
              dark:border-indigo-800/30
              shadow-lg
              shadow-indigo-500/5
            "
          >
            <Icon
              className="
                h-8
                w-8
                text-indigo-600
                dark:text-indigo-400
              "
            />
          </div>

          {/* Text */}
          <div>
            <h1
              className="
                text-2xl
                font-bold
                text-slate-800
                dark:text-slate-100
              "
            >
              {title}
            </h1>

            {description && (
              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {description}
              </p>
            )}

            {typeof total === "number" && (
              <p
                className="
                  mt-2
                  text-sm
                  text-slate-500
                  dark:text-slate-500
                "
              >
                {total} {total === 1 ? t("record") : t("records")}
              </p>
            )}
          </div>
        </div>

        {/* Add Button */}
        <Button
          onClick={onAdd}
          className="
            h-12
            rounded-xl
            px-6
            gap-2
            bg-gradient-to-r
            from-indigo-600
            to-purple-600
            hover:from-indigo-700
            hover:to-purple-700
            text-white
            font-medium
            shadow-lg
            shadow-indigo-500/20
            hover:shadow-indigo-500/30
            transition-all
            duration-200
          "
        >
          <Plus className="h-5 w-5" />
          {addLabel}
        </Button>
      </div>

      {/* Search */}
      <div
        className="
          rounded-2xl
          border
          border-slate-200/50
          dark:border-slate-800/50
          bg-white/60
          dark:bg-slate-900/60
          backdrop-blur-sm
          p-4
          shadow-sm
        "
      >
        <LookupSearch
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      </div>
    </div>
  );
}