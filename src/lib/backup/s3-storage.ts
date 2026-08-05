// src/lib/backup/s3-storage.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { StorageProvider } from "./storage-provider";
import { Readable } from "stream";

export class S3Storage implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET!;
    this.client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
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

    return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  }
}