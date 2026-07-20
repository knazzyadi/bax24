// src/lib/repositories/base.repository.ts
import { requireCompanySession, type CompanySession } from "@/lib/auth";

export abstract class BaseRepository {
  protected static async company(): Promise<CompanySession> {
    return requireCompanySession();
  }
}