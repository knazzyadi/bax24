"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LookupSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function LookupSearch({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: LookupSearchProps) {
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search
        className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
      />

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ps-9 pe-10"
      />

      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute end-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={() => onChange("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}