// src/hooks/useToastNotifications.ts
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner"; // ✅ إزالة 'type ToastOptions' لأنها غير مصدرة

export function useToastNotifications() {
  const t = useTranslations("notifications");

  const success = useCallback(
    (messageKey: string, values?: Record<string, string | number>, options?: any) => {
      const message = t(messageKey, values);
      toast.success(message, { duration: 3000, ...options });
    },
    [t]
  );

  const error = useCallback(
    (messageKey: string, values?: Record<string, string | number>, options?: any) => {
      const message = t(messageKey, values);
      toast.error(message, { duration: 4000, ...options });
    },
    [t]
  );

  const info = useCallback(
    (messageKey: string, values?: Record<string, string | number>, options?: any) => {
      const message = t(messageKey, values);
      toast.info(message, { duration: 3000, ...options });
    },
    [t]
  );

  const promise = useCallback(
    <T>(
      promise: Promise<T>,
      messages: {
        loadingKey: string;
        successKey: string;
        errorKey: string;
        loadingValues?: Record<string, string | number>;
        successValues?: Record<string, string | number>;
        errorValues?: Record<string, string | number>;
      },
      options?: any
    ) => {
      return toast.promise(promise, {
        loading: t(messages.loadingKey, messages.loadingValues),
        success: t(messages.successKey, messages.successValues),
        error: t(messages.errorKey, messages.errorValues),
        ...options,
      });
    },
    [t]
  );

  const showSaved = useCallback(
    (name?: string) => success("saved", { name: name || t("item") }),
    [success, t]
  );

  const showUpdated = useCallback(
    (name?: string) => success("updated", { name: name || t("item") }),
    [success, t]
  );

  const showDeleted = useCallback(
    (name?: string) => success("deleted", { name: name || t("item") }),
    [success, t]
  );

  const showCancelled = useCallback(
    (name?: string) => success("cancelled", { name: name || t("item") }),
    [success, t]
  );

  const showTicketAccepted = useCallback(() => success("ticket.accepted"), [success]);
  const showTicketRejected = useCallback(() => success("ticket.rejected"), [success]);
  const showGenericError = useCallback(() => error("errors.generic"), [error]);

  return {
    success,
    error,
    info,
    promise,
    showSaved,
    showUpdated,
    showDeleted,
    showCancelled,
    showTicketAccepted,
    showTicketRejected,
    showGenericError,
  };
}