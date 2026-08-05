// src/lib/backup/storage-provider.ts
import { Readable } from "stream";

export interface StorageProvider {
  /**
   * رفع بيانات إلى التخزين الخارجي
   * @param data - Buffer أو Readable Stream
   * @param fileName - اسم الملف في التخزين
   * @returns رابط الملف (URL)
   */
  upload(data: Buffer | Readable, fileName: string): Promise<string>;
}