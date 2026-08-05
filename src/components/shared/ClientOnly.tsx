// src/components/shared/ClientOnly.tsx
"use client";

import { ReactNode, useState } from "react";

export function ClientOnly({ children }: { children: ReactNode }) {
  const [hasMounted] = useState(() => typeof window !== "undefined");

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}