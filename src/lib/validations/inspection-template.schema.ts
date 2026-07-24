// src/lib/validations/inspection-template.schema.ts
import { z } from "zod";

export const InspectionTemplateSchema = z.object({
  id: z.string().optional(),
  companyId: z.string().optional(),
  sectionId: z.string().min(1, "Section ID is required"),
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

export const CreateInspectionTemplateSchema = InspectionTemplateSchema.omit({
  id: true,
  companyId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const UpdateInspectionTemplateSchema = CreateInspectionTemplateSchema.partial();