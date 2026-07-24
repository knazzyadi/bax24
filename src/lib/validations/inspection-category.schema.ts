// src/lib/validations/inspection-category.schema.ts
import { z } from "zod";

export const InspectionCategorySchema = z.object({
  id: z.string().optional(),
  companyId: z.string().optional(),
  templateId: z.string().min(1, "Template ID is required"), // ✅ تمت الإضافة
  code: z.string().min(1, "Code is required").max(50, "Code must be at most 50 characters"),
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters"),
  nameAr: z.string().max(255, "Arabic name must be at most 255 characters").optional().nullable(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional().nullable(),
});

export const CreateInspectionCategorySchema = InspectionCategorySchema.omit({
  id: true,
  companyId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const UpdateInspectionCategorySchema = CreateInspectionCategorySchema.partial();