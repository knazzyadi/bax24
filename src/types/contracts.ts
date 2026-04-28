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
  attachments: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  companyId: string;
  branchId: string | null;
  createdBy: string | null;
}