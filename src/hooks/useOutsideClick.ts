// src/hooks/useOutsideClick.ts
import { useEffect, RefObject } from "react";

/**
 * هوك لاكتشاف النقر خارج عنصر معين
 * @param ref - المرجع (ref) للعنصر المراد مراقبته
 * @param handler - الدالة التي سيتم تنفيذها عند النقر خارج العنصر
 */
export function useOutsideClick<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      const el = ref?.current;
      // إذا كان العنصر غير موجود أو أن النقرة وقعت داخل العنصر، نخرج
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]); // إعادة التفعيل عند تغيير ref أو handler
}