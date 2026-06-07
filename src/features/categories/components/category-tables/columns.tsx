'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';
import { Category } from '../category-client';

export const columns: ColumnDef<Category>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Category, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ cell }) => <div className="font-semibold">{cell.getValue<Category['name']>()}</div>,
    meta: {
      label: 'Name',
      placeholder: 'Search categories...',
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
    accessorKey: 'isActive',
    header: 'STATUS',
    cell: ({ cell }) => {
      const active = cell.getValue<boolean>();
      return (
        <Badge
          variant={active ? 'default' : 'secondary'}
          className={
            active 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border-rose-500/20'
          }
        >
          {active ? 'Active' : 'Inactive'}
        </Badge>
      );
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
