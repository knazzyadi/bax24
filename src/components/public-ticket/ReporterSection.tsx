"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ReporterSectionProps {
  name: string;
  email: string;
  phone: string;
  onNameChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
  isRtl: boolean;
  disabled: boolean;
}

export function ReporterSection({
  name,
  email,
  phone,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  isRtl,
  disabled,
}: ReporterSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold mb-2 block">{isRtl ? "الاسم *" : "Name *"}</Label>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="h-12 text-base"
          placeholder={isRtl ? "الاسم الكامل" : "Full name"}
          disabled={disabled}
          autoComplete="name"
        />
      </div>
      <div>
        <Label className="text-base font-semibold mb-2 block">{isRtl ? "البريد الإلكتروني *" : "Email *"}</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="h-12 text-base"
          placeholder="example@domain.com"
          disabled={disabled}
          autoComplete="email"
        />
      </div>
      <div>
        <Label className="text-base font-semibold mb-2 block">{isRtl ? "رقم الهاتف (اختياري)" : "Phone (optional)"}</Label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className="h-12 text-base"
          placeholder={isRtl ? "05xxxxxxxx" : "+9665xxxxxxxx"}
          disabled={disabled}
          autoComplete="tel"
        />
      </div>
    </div>
  );
}