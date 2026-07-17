// work-orders/schemas.ts
import { z } from "zod";

export const workOrderSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().optional(),
  type: z.enum(["MAINTENANCE", "CORRECTIVE", "EMERGENCY", "BULK_PREVENTIVE"]),
  source: z.enum(["ticket", "pm", "checklist", "manual"]),
  priorityId: z.string().min(1, "الأولوية مطلوبة"),
  statusId: z.string().optional(),
  category: z.enum(["ELECTRICAL", "MECHANICAL", "HVAC", "MEDICAL", "FIRE", "IT", "CIVIL", "OTHER"]).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  branchId: z.string().min(1, "الفرع مطلوب"),
  buildingId: z.string().optional(),
  floorId: z.string().optional(),
  roomId: z.string().optional(),
  assetIds: z.array(z.string()).optional(),
  assignedTo: z.array(z.string()).optional(),
  sourceId: z.string().optional(),
});