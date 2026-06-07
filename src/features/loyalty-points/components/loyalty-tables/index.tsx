'use client';

import { GenericTable } from '@/components/ui/table/generic-table';
import { ColumnDef } from '@tanstack/react-table';
import { LoyaltyCustomer } from './columns';

interface LoyaltyTableProps {
  data: LoyaltyCustomer[];
  totalItems: number;
  columns: ColumnDef<LoyaltyCustomer>[];
  onAdjustPoints: (user: LoyaltyCustomer) => void;
}

export function LoyaltyTable({
  data,
  totalItems,
  columns,
  onAdjustPoints
}: LoyaltyTableProps) {
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
