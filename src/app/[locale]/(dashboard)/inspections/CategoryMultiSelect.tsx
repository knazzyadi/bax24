"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface CategoryOption {
  value: string;
  label: string;
}

interface CategoryMultiSelectProps {
  isRtl: boolean;
  disabled?: boolean;

  options: CategoryOption[];

  selectedValues: string[];

  opened: boolean;

  onToggle: () => void;

  onChange: (values: string[]) => void;
}

export function CategoryMultiSelect({
  isRtl,
  disabled,
  options,
  selectedValues,
  opened,
  onToggle,
  onChange,
}: CategoryMultiSelectProps) {
  const allSelected =
    options.length > 0 &&
    selectedValues.length === options.length;

  const toggleCategory = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter((id) => id !== value));
    }
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      onChange(options.map((o) => o.value));
    } else {
      onChange([]);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        disabled={disabled}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span>
            {selectedValues.length === 0
              ? isRtl
                ? "اختر الفئات"
                : "Select categories"
              : `${selectedValues.length} ${
                  isRtl ? "فئة محددة" : "selected"
                }`}
          </span>

          {selectedValues.length > 0 && (
            <Badge variant="secondary">
              {selectedValues.length}
            </Badge>
          )}
        </div>
      </Button>

      {opened && (
        <div className="border rounded-lg p-3 space-y-2 bg-background max-h-72 overflow-auto">
          <div className="flex items-center gap-2 border-b pb-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) =>
                toggleAll(Boolean(checked))
              }
            />

            <span className="font-medium">
              {isRtl ? "تحديد جميع الفئات" : "Select all"}
            </span>
          </div>

          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center gap-2"
            >
              <Checkbox
                checked={selectedValues.includes(option.value)}
                onCheckedChange={(checked) =>
                  toggleCategory(
                    option.value,
                    Boolean(checked)
                  )
                }
              />

              <span>{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}