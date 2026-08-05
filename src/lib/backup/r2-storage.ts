// src/lib/backup/r2-storage.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { StorageProvider } from "./storage-provider";
import { Readable } from "stream";

export class R2Storage implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor() {
    this.endpoint = process.env.R2_ENDPOINT!;
    this.bucket = process.env.R2_BUCKET!;

    this.client = new S3Client({
      region: "auto",
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async upload(data: Buffer | Readable, fileName: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
      Body: data,
      ContentType: "application/gzip",
    });

    await this.client.send(command);

    // إرجاع الرابط العام (يمكن تخصيصه)
    return `https://${this.bucket}.${this.endpoint.replace("https://", "")}/${fileName}`;
  }
}