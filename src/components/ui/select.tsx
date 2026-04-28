// src/components/ui/select.tsx
//وظيفته القوائم المنسدلة
"use client";
import * as React from "react";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type SelectContextValue = {
  value?: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  disabled?: boolean;
  triggerWidth?: number;
  setTriggerWidth?: (width: number) => void;
};
const SelectContext = React.createContext<SelectContextValue | null>(null);
function useSelect() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select must be used within Select");
  return ctx;
}

type SelectProps = {
  value?: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
};
function Select({ value, onValueChange, children, disabled = false }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [triggerWidth, setTriggerWidth] = React.useState(0);
  const handleOpenChange = (newOpen: boolean) => {
    if (!disabled) setOpen(newOpen);
  };
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, disabled, triggerWidth, setTriggerWidth }}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        {children}
      </Popover>
    </SelectContext.Provider>
  );
}

type SelectTriggerProps = {
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
};
function SelectTrigger({ className, children, placeholder = "Select..." }: SelectTriggerProps) {
  const { setOpen, value, disabled, setTriggerWidth } = useSelect();
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (triggerRef.current && setTriggerWidth) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [setTriggerWidth]);

  return (
    <PopoverTrigger asChild>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium shadow-sm transition-all",
          "h-12 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {children ?? value ?? placeholder}
        </span>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </button>
    </PopoverTrigger>
  );
}

type SelectContentProps = {
  className?: string;
  children: React.ReactNode;
  placeholder?: string;
};
function SelectContent({ className, children, placeholder = "بحث..." }: SelectContentProps) {
  const { setOpen, disabled, triggerWidth } = useSelect();
  const [searchTerm, setSearchTerm] = React.useState("");

  if (disabled) return null;

  const childrenArray = React.Children.toArray(children);
  const filteredChildren = childrenArray.filter((child) => {
    if (React.isValidElement(child) && child.type === SelectItem) {
      const props = child.props as { children?: React.ReactNode };
      const childText = props.children?.toString() || "";
      return searchTerm === "" || childText.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <PopoverContent
      align="start"
      sideOffset={4}
      style={{ width: triggerWidth ? `${triggerWidth}px` : "auto" }}
      className={cn("p-0 bg-card border-border shadow-lg", className)}
      onEscapeKeyDown={() => setOpen(false)}
      onInteractOutside={() => setOpen(false)}
    >
      <div className="p-2">   {/* ✅ تمت إزالة border-b */}
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      <div className="max-h-[200px] overflow-y-auto p-1">
        {filteredChildren.length > 0 ? (
          filteredChildren
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            لا توجد نتائج
          </div>
        )}
      </div>
    </PopoverContent>
  );
}

type SelectItemProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};
function SelectItem({ value, children, className }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setOpen } = useSelect();
  const isSelected = selectedValue === value;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        className
      )}
      onClick={() => {
        onValueChange(value);
        setOpen(false);
      }}
    >
      <span>{children}</span>
      {isSelected && <CheckIcon className="size-4" />}
    </div>
  );
}

type SelectValueProps = { placeholder?: string };
function SelectValue({ placeholder = "Select..." }: SelectValueProps) {
  const { value } = useSelect();
  return <>{value ?? placeholder}</>;
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
export default Select;