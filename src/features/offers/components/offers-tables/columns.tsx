'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Offer } from '../offers-client';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Offer>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="CODE" />
    ),
    cell: ({ row }) => <span className="font-extrabold text-red-600">#{row.original.code}</span>
  },
  {
    accessorKey: 'description',
    header: 'DESCRIPTION',
    cell: ({ row }) => <span className="text-xs font-medium">{row.original.description}</span>
  },
  {
    id: 'type_value',
    header: 'DISCOUNT',
    cell: ({ row }) => {
      const type = row.original.discountType;
      const val = parseFloat(row.original.discountValue);
      if (type === 'percentage') {
        return (
          <div className="flex flex-col">
            <span className="font-bold text-sm">{val}% OFF</span>
            {row.original.maxDiscount && (
              <span className="text-[10px] text-muted-foreground">Up to ₹{parseFloat(row.original.maxDiscount).toFixed(2)}</span>
            )}
          </div>
        );
      }
      return <span className="font-bold text-sm">₹{val.toFixed(2)} OFF</span>;
    }
  },
  {
    accessorKey: 'minBillAmount',
    header: 'MIN BILL AMOUNT',
    cell: ({ row }) => <span>₹{parseFloat(row.original.minBillAmount).toFixed(2)}</span>
  },
  {
    accessorKey: 'isActive',
    header: 'STATUS',
    cell: ({ row }) => {
      const active = row.original.isActive;
      return (
        <Badge variant={active ? 'success' : 'secondary'} className="font-bold">
          {active ? 'Active' : 'Inactive'}
        </Badge>
      );
    }
  },
  {
    id: 'actions',
    header: 'ACTIONS',
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
