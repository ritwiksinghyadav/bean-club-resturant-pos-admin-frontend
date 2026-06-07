'use client';

import { GenericTable } from '@/components/ui/table/generic-table';
import { ColumnDef } from '@tanstack/react-table';
import { UserCustomer } from './columns';

interface UserTableProps {
  data: UserCustomer[];
  totalItems: number;
  columns: ColumnDef<UserCustomer>[];
  onAdjustPoints: (user: UserCustomer) => void;
}

export function UserTable({
  data,
  totalItems,
  columns,
  onAdjustPoints
}: UserTableProps) {
  return (
    <GenericTable
      data={data}
      totalItems={totalItems}
      columns={columns}
      meta={{
        onAdjustPoints
      }}
    />
  );
}
