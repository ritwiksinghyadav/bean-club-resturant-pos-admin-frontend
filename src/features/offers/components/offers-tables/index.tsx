'use client';

import { GenericTable } from '@/components/ui/table/generic-table';
import { ColumnDef } from '@tanstack/react-table';
import { Offer } from '../offers-client';

interface OfferTableProps {
  data: Offer[];
  totalItems: number;
  columns: ColumnDef<Offer>[];
  onEdit: (offer: Offer) => void;
  onDelete: (id: string) => void;
}

export function OfferTable({
  data,
  totalItems,
  columns,
  onEdit,
  onDelete
}: OfferTableProps) {
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
