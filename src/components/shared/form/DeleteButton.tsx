// src/components/shared/form/DeleteButton.tsx
"use client";

import * as React from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DeleteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  icon?: boolean;
  children?: React.ReactNode;
}

export function DeleteButton({
  loading = false,
  icon = true,
  children = "حذف",
  className,
  disabled,
  ...props
}: DeleteButtonProps) {
  return (
    <Button
      type="button"
      variant="destructive"
      disabled={disabled || loading}
      className={cn(
        "min-w-[110px] rounded-xl",
        "bg-rose-500 hover:bg-rose-600",
        "text-white",
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        icon && <Trash2 className="mr-2 h-4 w-4" />
      )}
      {children}
    </Button>
  );
}

export default DeleteButton;