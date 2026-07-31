export interface ContractAttachment {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface Contract {
  id: string;
  code: string | null;
  title: string;
  supplier: string;
  value: number;
  startDate: Date;
  endDate: Date;
  description: string | null;
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  cancellationReason: string | null;
  notes: string | null;

  // إذا كنت تعرف شكل المرفقات فاستخدم ContractAttachment[]
  attachments: ContractAttachment[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  companyId: string;
  branchId: string | null;
  createdBy: string | null;
}