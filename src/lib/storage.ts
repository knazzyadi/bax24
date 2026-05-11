// lib/storage.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// تهيئة عميل S3 (متوافق مع R2)
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

/**
 * رفع ملف إلى R2 وإرجاع المفتاح (key) والعنوان (url)
 * @param file الملف المراد رفعه (من FormData)
 * @param folder المجلد داخل bucket (مثل "tickets")
 * @returns { key, url, mimeType, size, originalName }
 */
export async function uploadFileToR2(
  file: File,
  folder: string = "tickets"
): Promise<{
  key: string;
  url: string;
  mimeType: string;
  size: number;
  originalName: string;
}> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "bin";
  const key = `${folder}/${Date.now()}-${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  });

  await s3.send(command);

  // بناء الرابط العام (لاحظ أن R2 يمكن أن يكون عاماً إذا كان bucket public)
  // يمكنك استخدام domain مخصص أو الرابط الافتراضي
  const url = `https://${BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  return {
    key,
    url,
    mimeType: file.type,
    size: file.size,
    originalName: file.name,
  };
}

/**
 * حذف ملف من R2
 * @param key المفتاح المخزن في قاعدة البيانات
 */
export async function deleteFileFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await s3.send(command);
}