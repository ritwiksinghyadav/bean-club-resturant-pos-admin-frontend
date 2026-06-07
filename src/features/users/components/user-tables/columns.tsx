'use client';

import React from 'react';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CellAction } from './cell-action';
import { Coins, Text } from 'lucide-react';

export type UserCustomer = {
  id: string;
  name: string;
  phoneNumber: string;
  pointsBalance: number;
  createdAt: string;
};

export const columns: ColumnDef<UserCustomer>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<UserCustomer, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ cell }) => <div className="font-semibold text-foreground">{cell.getValue<UserCustomer['name']>()}</div>,
    meta: {
      label: 'Name',
      placeholder: 'Search name...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    id: 'phoneNumber',
    accessorKey: 'phoneNumber',
    header: ({ column }: { column: Column<UserCustomer, unknown> }) => (
      <DataTableColumnHeader column={column} title='Phone Number' />
    ),
    cell: ({ cell }) => <div className="text-muted-foreground font-mono text-xs">{cell.getValue<UserCustomer['phoneNumber']>()}</div>,
    meta: {
      label: 'Phone Number',
      placeholder: 'Search phone...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'pointsBalance',
    header: 'POINTS BALANCE',
    cell: ({ row }) => {
      const balance = row.original.pointsBalance;
      return (
        <Badge variant="outline" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-black">
          <Coins className="w-3.5 h-3.5" />
          {balance} pts
        </Badge>
      );
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'DATE JOINED',
    cell: ({ cell }) => {
      const dateStr = cell.getValue<string>();
      return (
        <div className="text-muted-foreground text-xs">
          {new Date(dateStr).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>
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
          onAdjustPoints={meta?.onAdjustPoints}
        />
      );
    }
  }
];
