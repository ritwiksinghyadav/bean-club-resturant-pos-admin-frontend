'use client';

import { GenericTable } from '@/components/ui/table/generic-table';
import { ColumnDef } from '@tanstack/react-table';
import { Variant } from '../variant-client';

interface VariantTableProps {
  data: Variant[];
  totalItems: number;
  columns: ColumnDef<Variant>[];
  onEdit: (variant: Variant) => void;
  onDelete: (id: string) => void;
}

export function VariantTable({
  data,
  totalItems,
  columns,
  onEdit,
  onDelete
}: VariantTableProps) {
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
