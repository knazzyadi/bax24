"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdaptiveSelect } from "@/components/shared/AdaptiveSelect";

interface TicketDetailsSectionProps {
  type: string;
  onTypeChange: (val: string) => void;
  title: string;
  onTitleChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  ticketTypeOptions: { value: string; label: string }[];
  isRtl: boolean;
  disabled: boolean;
}

export function TicketDetailsSection({
  type,
  onTypeChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  ticketTypeOptions,
  isRtl,
  disabled,
}: TicketDetailsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold mb-2 block">
          {isRtl ? "نوع البلاغ *" : "Ticket Type *"}
        </Label>
        <AdaptiveSelect
          value={type}
          onChange={onTypeChange}
          options={ticketTypeOptions}
          placeholder={isRtl ? "اختر نوع البلاغ" : "Select type"}
          disabled={disabled}
        />
      </div>
      <div>
        <Label className="text-base font-semibold mb-2 block">
          {isRtl ? "عنوان البلاغ *" : "Ticket Title *"}
        </Label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-12 text-base"
          placeholder={isRtl ? "مثال: عطل في التكييف" : "e.g., AC malfunction"}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
      <div>
        <Label className="text-base font-semibold mb-2 block">
          {isRtl ? "وصف البلاغ *" : "Description *"}
        </Label>
        <Textarea
          rows={5}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="text-base"
          placeholder={isRtl ? "تفاصيل المشكلة" : "Problem details"}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
    </div>
  );
}