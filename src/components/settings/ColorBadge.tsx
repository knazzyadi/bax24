"use client";

interface ColorBadgeProps {
  color?: string;
  label?: string;
}

export function ColorBadge({
  color = "#64748B",
  label,
}: ColorBadgeProps) {
  return (
    <div
      className="
        inline-flex
        items-center
        gap-2
        rounded-full
        px-3
        py-1
        bg-indigo-50/50
        dark:bg-indigo-950/30
        border
        border-indigo-200/50
        dark:border-indigo-800/50
        text-indigo-600
        dark:text-indigo-300
      "
    >
      <span
        className="
          h-4
          w-4
          rounded-full
          border
          border-white
          dark:border-slate-700
          shadow-sm
        "
        style={{
          backgroundColor: color,
        }}
      />

      {label && (
        <span
          className="
            text-sm
            font-medium
          "
        >
          {label}
        </span>
      )}
    </div>
  );
}