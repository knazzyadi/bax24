"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";

interface ActionButtonsProps {
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isRtl: boolean;
}

export function ActionButtons({
  onSubmit,
  onCancel,
  isSubmitting,
  isRtl,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col gap-4 pt-6 border-t border-border">
      <Button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full py-3 text-base rounded-full"
      >
        {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Send size={20} className="mr-2" />}
        {isRtl ? "إرسال البلاغ" : "Submit"}
      </Button>
      <Button
        onClick={onCancel}
        variant="outline"
        className="w-full py-3 text-base rounded-full"
        disabled={isSubmitting}
      >
        {isRtl ? "إلغاء" : "Cancel"}
      </Button>
    </div>
  );
}