// src/app/[locale]/(dashboard)/locations/floors/FloorsTable.tsx
'use client';

import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/layout/DataTable';
import type { Floor, Building } from './types';

 interface FloorsTableProps {
  data: Floor[];
  buildings: Building[];
  onEdit: (floor: Floor) => void;
  onDelete: (id: string) => void;
  isRtl: boolean;
}

export function FloorsTable({
  data,
  onEdit,
  onDelete,
  isRtl,
}: FloorsTableProps) {

  const columns = [
    {
      key: 'name',
      title: isRtl ? 'الاسم' : 'Name',
      headerClassName: isRtl ? 'text-right' : 'text-left',
      render: (row: Floor) => (
        <span className={`font-medium text-foreground ${isRtl ? 'text-right' : 'text-left'} block`}>
          {isRtl ? row.name : row.nameEn || row.name}
        </span>
      ),
    },
    {
      key: 'code',
      title: isRtl ? 'الكود' : 'Code',
      headerClassName: isRtl ? 'text-right' : 'text-left',
      render: (row: Floor) => (
        <span className={`${isRtl ? 'text-right' : 'text-left'} block`}>
          {row.code || '—'}
        </span>
      ),
    },
    {
      key: 'order',
      title: isRtl ? 'الترتيب' : 'Order',
      headerClassName: isRtl ? 'text-right' : 'text-left',
      render: (row: Floor) => (
        <span className={`${isRtl ? 'text-right' : 'text-left'} block`}>
          {row.order ?? '—'}
        </span>
      ),
    },
    {
      key: 'buildingName',
      title: isRtl ? 'المبنى' : 'Building',
      headerClassName: isRtl ? 'text-right' : 'text-left',
      render: (row: Floor) => (
        <span className={`${isRtl ? 'text-right' : 'text-left'} block`}>
          {row.building?.name || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: isRtl ? 'الإجراءات' : 'Actions',
      headerClassName: isRtl ? 'text-right' : 'text-right',
      render: (row: Floor) => (
        <div className={`flex items-center gap-2 ${isRtl ? 'justify-end' : 'justify-end'}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(row)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary transition-colors"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(row.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} rowKey="id" />;
}