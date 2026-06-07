'use client';

import { GenericTable } from '@/components/ui/table/generic-table';
import { ColumnDef } from '@tanstack/react-table';
import { Category } from '../category-client';

interface CategoryTableProps {
  data: Category[];
  totalItems: number;
  columns: ColumnDef<Category>[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export function CategoryTable({
  data,
  totalItems,
  columns,
  onEdit,
  onDelete
}: CategoryTableProps) {
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

