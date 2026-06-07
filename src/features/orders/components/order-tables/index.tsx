'use client';

import { GenericTable } from '@/components/ui/table/generic-table';
import { ColumnDef } from '@tanstack/react-table';
import { Order } from '../order-client';

interface OrderTableProps {
  data: Order[];
  totalItems: number;
  columns: ColumnDef<Order>[];
  onView: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

export function OrderTable({
  data,
  totalItems,
  columns,
  onView,
  onUpdateStatus
}: OrderTableProps) {
  return (
    <GenericTable
      data={data}
      totalItems={totalItems}
      columns={columns}
      meta={{
        onView,
        onUpdateStatus
      }}
    />
  );
}
