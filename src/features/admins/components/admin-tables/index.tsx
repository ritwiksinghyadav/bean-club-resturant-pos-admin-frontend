'use client';

import { GenericTable } from '@/components/ui/table/generic-table';
import { ColumnDef } from '@tanstack/react-table';
import { Admin } from '../admin-client';

interface AdminTableProps {
  data: Admin[];
  totalItems: number;
  columns: ColumnDef<Admin>[];
  onEdit: (admin: Admin) => void;
  onDelete: (id: string) => void;
}

export function AdminTable({
  data,
  totalItems,
  columns,
  onEdit,
  onDelete
}: AdminTableProps) {
  return (
    <GenericTable
      data={data}
      totalItems={totalItems}
      columns={columns}
      meta={{
        onEdit,
        onDelete
      }}
    />
  );
}
