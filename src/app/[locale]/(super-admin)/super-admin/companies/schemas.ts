// src/app/[locale]/(super-admin)/super-admin/companies/schemas.ts
import { z } from 'zod';

export const companySchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  nameEn: z.string().optional(),
  email: z.string().email('بريد إلكتروني غير صحيح').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  subscriptionEndDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

// القيم الافتراضية للـ Form
export const defaultCompanyValues: CompanyFormValues = {
  name: '',
  nameEn: '',
  email: '',
  phone: '',
  address: '',
  subscriptionEndDate: '',
  isActive: true,
};