// src/components/shared/form/LocationField.tsx
//حقل الموقع (جاهز)
import { MapPin } from "lucide-react";
import LocationSelector from "@/components/shared/LocationSelector";
import { FormField } from "./FormField";

interface LocationFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function LocationField({ value, onChange }: LocationFieldProps) {
  return (
    <FormField label="تحديد الموقع" icon={<MapPin size={14} />}>
      <LocationSelector value={value} onValueChange={onChange} />
    </FormField>
  );
}