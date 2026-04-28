//src\lib\utils.ts
//دمج وإدارة كلاسّات Tailwind CSS بشكل ذكي بدون تعارض
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}