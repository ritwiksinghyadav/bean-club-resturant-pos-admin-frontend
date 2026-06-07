'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';
import { Variant } from '../variant-client';

export const columns: ColumnDef<Variant>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Variant, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ cell }) => <div className="font-semibold">{cell.getValue<Variant['name']>()}</div>,
    meta: {
      label: 'Name',
      placeholder: 'Search sizing variants...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'description',
    header: 'DESCRIPTION',
    cell: ({ cell }) => {
      const desc = cell.getValue<string | null>();
      return <span className="text-muted-foreground line-clamp-1 max-w-[400px]">{desc || '—'}</span>;
    }
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const meta = table.options.meta as any;
      return (
        <CellAction 
          data={row.original} 
          onEdit={meta?.onEdit}
          onDelete={meta?.onDelete}
        />
      );
    }
  }
];
