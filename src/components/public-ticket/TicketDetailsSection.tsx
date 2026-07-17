"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      {/* نوع البلاغ - باستخدام Select من shadcn/ui */}
      <div>
        <Label className="text-base font-semibold mb-2 block">
          {isRtl ? "نوع البلاغ *" : "Ticket Type *"}
        </Label>
        <Select
          value={type}
          onValueChange={onTypeChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-12 text-base rounded-xl">
            <SelectValue placeholder={isRtl ? "اختر نوع البلاغ" : "Select type"} />
          </SelectTrigger>
          <SelectContent>
            {ticketTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* عنوان البلاغ */}
      <div>
        <Label className="text-base font-semibold mb-2 block">
          {isRtl ? "عنوان البلاغ *" : "Ticket Title *"}
        </Label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-12 text-base rounded-xl"
          placeholder={isRtl ? "مثال: عطل في التكييف" : "e.g., AC malfunction"}
          disabled={disabled}
          autoComplete="off"
        />
      </div>

      {/* وصف البلاغ */}
      <div>
        <Label className="text-base font-semibold mb-2 block">
          {isRtl ? "وصف البلاغ *" : "Description *"}
        </Label>
        <Textarea
          rows={5}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="text-base rounded-xl"
          placeholder={isRtl ? "تفاصيل المشكلة" : "Problem details"}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
    </div>
  );
}