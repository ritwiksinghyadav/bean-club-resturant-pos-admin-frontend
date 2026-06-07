'use client';

import { ColumnDef, Column } from '@tanstack/react-table';
import { Order } from '../order-client';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Timer, Eye, ChevronRight } from 'lucide-react';
import { CellAction } from './cell-action';
import { Button } from '@/components/ui/button';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:   { label: 'Pending Pay',  color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',   dot: 'bg-amber-500' },
  approved:  { label: 'Approved',     color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   dot: 'bg-green-500' },
  preparing: { label: 'Preparing',    color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-500 animate-pulse' },
  completed: { label: 'Completed',    color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-200',dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled',    color: 'text-rose-700',   bg: 'bg-rose-50 border-rose-200',     dot: 'bg-rose-500' },
};

function getElapsedTime(createdAtStr: string) {
  try {
    const diffMins = Math.floor((Date.now() - new Date(createdAtStr).getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m ago`;
  } catch { return ''; }
}

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'tokenNumber',
    header: 'TOKEN',
    cell: ({ row }) => <span className="text-base font-black text-red-600">#{row.original.tokenNumber}</span>,
  },
  {
    id: 'customer',
    header: 'CUSTOMER',
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">{order.user?.name}</p>
          <p className="text-[11px] text-muted-foreground">{order.user?.phoneNumber}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Timer className="w-3 h-3" />{getElapsedTime(order.createdAt)}
          </p>
        </div>
      );
    }
  },
  {
    id: 'items',
    header: 'ITEMS',
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className="text-xs text-muted-foreground max-w-[200px]">
          <p className="font-semibold text-foreground">
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </p>
          <p className="truncate">{order.items.map((i) => i.menuItem?.name).join(', ')}</p>
        </div>
      );
    }
  },
  {
    accessorKey: 'totalAmount',
    header: 'TOTAL',
    cell: ({ row }) => {
      const amt = parseFloat(row.original.totalAmount);
      const isPending = row.original.status === 'pending';
      const isPointsOnly = amt === 0 && (row.original.pointsRedeemed ?? 0) > 0;
      return (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">
            ₹{amt.toFixed(2)}
          </span>
          {isPointsOnly && isPending && (
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/50 rounded px-1.5 py-0.5 mt-1 self-start whitespace-nowrap">
              Paid with Points
            </span>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'status',
    header: 'STATUS',
    cell: ({ row }) => {
      const status = row.original.status;
      const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400' };
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${cfg.color} ${cfg.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
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
          onUpdateStatus={meta?.onUpdateStatus}
        />
      );
    }
  },
  {
    id: 'view',
    header: '',
    cell: ({ row, table }) => {
      const meta = table.options.meta as any;
      return (
        <div className="flex justify-end">
          <Button 
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 opacity-60 hover:opacity-100 transition-all bg-muted/60 hover:bg-muted px-2.5 py-1.5 rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              if (meta?.onView) meta.onView(row.original);
            }}
          >
            <Eye className="w-3.5 h-3.5" />
            View
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      );
    }
  }
];
