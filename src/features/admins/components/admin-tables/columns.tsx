'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';
import { Admin } from '../admin-client';

export const columns: ColumnDef<Admin>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Admin, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ cell }) => <div className="font-semibold">{cell.getValue<Admin['name']>()}</div>,
    meta: {
      label: 'Name',
      placeholder: 'Search admins...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: ({ column }: { column: Column<Admin, unknown> }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ cell }) => <div className="text-muted-foreground">{cell.getValue<Admin['email']>()}</div>,
    meta: {
      label: 'Email',
      placeholder: 'Search email...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'role.name',
    header: 'ROLE',
    cell: ({ row }) => {
      const roleName = row.original.role?.name || 'Unknown';
      let badgeClass = '';
      
      switch (roleName.toLowerCase()) {
        case 'superadmin':
          badgeClass = 'bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 border-violet-500/20';
          break;
        case 'admin':
          badgeClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-blue-500/20';
          break;
        case 'kitchen':
          badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/20';
          break;
        default:
          badgeClass = 'bg-gray-500/10 text-gray-600 dark:text-gray-400 hover:bg-gray-500/20 border-gray-500/20';
      }

      return (
        <Badge variant="outline" className={`capitalize font-medium ${badgeClass}`}>
          {roleName}
        </Badge>
      );
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
