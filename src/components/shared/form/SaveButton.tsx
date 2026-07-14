// src/components/shared/form/SaveButton.tsx
"use client";

import * as React from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SaveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  icon?: boolean;
  children?: React.ReactNode;
}

export function SaveButton({
  loading = false,
  icon = true,
  children = "حفظ",
  className,
  disabled,
  ...props
}: SaveButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || loading}
      className={cn(
        "min-w-[120px] rounded-xl",
        "bg-gradient-to-r from-indigo-600 to-purple-600",
        "text-white",
        "shadow-lg shadow-indigo-500/20",
        "transition-all duration-200",
        "hover:from-indigo-700 hover:to-purple-700",
        "hover:shadow-indigo-500/30",
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        icon && <Save className="mr-2 h-4 w-4" />
      )}
      {children}
    </Button>
  );
}

export default SaveButton;