'use client';

import { GenericTable } from '@/components/ui/table/generic-table';
import { ColumnDef } from '@tanstack/react-table';

interface ProductTableParams<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
}

export function ProductTable<TData, TValue>({
  data,
  totalItems,
  columns
}: ProductTableParams<TData, TValue>) {
  return (
    <GenericTable
      data={data}
      totalItems={totalItems}
      columns={columns}
    />
  );
}

