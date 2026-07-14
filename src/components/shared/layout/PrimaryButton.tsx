// src/components/shared/layout/PrimaryButton.tsx
"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PrimaryButtonProps extends React.ComponentProps<typeof Button> {
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

export function PrimaryButton({
  children,
  icon,
  endIcon,
  loading = false,
  loadingText,
  fullWidth = false,
  className,
  disabled,
  variant = "default",
  size = "default",
  ...props
}: PrimaryButtonProps) {
  return (
    <Button
      {...props}
      variant={variant}
      size={size}
      disabled={disabled || loading}
      className={cn(
        "h-11 rounded-xl px-5 font-medium",
        "bg-gradient-to-r from-indigo-600 to-purple-600",
        "text-white",
        "transition-all duration-200",
        "shadow-lg shadow-indigo-500/20",
        "hover:from-indigo-700 hover:to-purple-700",
        "hover:shadow-indigo-500/30",
        "focus-visible:ring-2 focus-visible:ring-ring",
        fullWidth && "w-full",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {icon && <span className="mr-2 flex items-center justify-center">{icon}</span>}
          <span className="truncate">{children}</span>
          {endIcon && <span className="ml-2 flex items-center justify-center">{endIcon}</span>}
        </>
      )}
    </Button>
  );
}

export default PrimaryButton;