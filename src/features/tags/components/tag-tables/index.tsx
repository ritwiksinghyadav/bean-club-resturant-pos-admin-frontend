'use client';

import { GenericTable } from '@/components/ui/table/generic-table';
import { ColumnDef } from '@tanstack/react-table';
import { Tag } from '../tag-client';

interface TagTableProps {
  data: Tag[];
  totalItems: number;
  columns: ColumnDef<Tag>[];
  onEdit: (tag: Tag) => void;
  onDelete: (id: string) => void;
}

export function TagTable({
  data,
  totalItems,
  columns,
  onEdit,
  onDelete
}: TagTableProps) {
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
