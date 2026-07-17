// src/components/shared/form/LocationField.tsx
import { MapPin } from "lucide-react";
import LocationSelector, { LocationValue } from "@/components/shared/LocationSelector";
import { FormField } from "./FormField";

interface LocationFieldProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}

export function LocationField({ value, onChange }: LocationFieldProps) {
  return (
    <FormField
    label={<span><MapPin size={14} className="inline" /> تحديد الموقع</span>}>
      <LocationSelector value={value} onChange={onChange} />
    </FormField>
  );
}