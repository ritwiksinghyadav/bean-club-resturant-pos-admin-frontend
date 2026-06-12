'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';

export type MenuItemVariant = {
  id: string;
  variantId: string;
  name: string;
  price: string;
  sku: string | null;
  isActive: boolean;
};

export type Tag = {
  id: string;
  name: string;
  description: string | null;
};

export type MenuItem = {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  basePrice: string;
  imageUrl: string | null;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  variants: MenuItemVariant[];
  tags: Tag[];
};

export const columns: ColumnDef<MenuItem>[] = [
  {
    accessorKey: 'imageUrl',
    header: 'IMAGE',
    cell: ({ row }) => {
      const imageUrl = row.original.imageUrl;
      return (
        <div className='bg-muted relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border'>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={row.original.name}
              className='h-full w-full object-cover'
            />
          ) : (
            <div className='text-primary text-[10px] font-semibold'>Bean</div>
          )}
        </div>
      );
    }
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<MenuItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ cell }) => (
      <div className='font-semibold'>{cell.getValue<MenuItem['name']>()}</div>
    ),
    meta: {
      label: 'Name',
      placeholder: 'Search products...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    id: 'category',
    accessorKey: 'category.name',
    header: ({ column }: { column: Column<MenuItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
    cell: ({ row }) => {
      const category = row.original.category;
      return (
        <Badge
          variant={category ? 'outline' : 'secondary'}
          className='capitalize'
        >
          {category ? category.name : 'Uncategorized'}
        </Badge>
      );
    }
  },
  {
    id: 'tags',
    accessorKey: 'tags',
    header: 'TAGS',
    cell: ({ row }) => {
      const tags = row.original.tags || [];
      return (
        <div className='flex max-w-[200px] flex-wrap gap-1'>
          {tags.length === 0 ? (
            <span className='text-muted-foreground text-xs'>—</span>
          ) : (
            tags.map((tag) => (
              <Badge
                key={tag.id}
                variant='secondary'
                className='border-sky-500/20 bg-sky-500/10 text-[10px] text-sky-600 hover:bg-sky-500/20 dark:text-sky-400'
              >
                {tag.name}
              </Badge>
            ))
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'basePrice',
    header: 'BASE PRICE',
    cell: ({ cell }) => {
      const price = parseFloat(cell.getValue<string>());
      return <span>₹{isNaN(price) ? '0.00' : price.toFixed(2)}</span>;
    }
  },
  {
    accessorKey: 'description',
    header: 'DESCRIPTION',
    cell: ({ cell }) => {
      const desc = cell.getValue<string | null>();
      return (
        <span className='text-muted-foreground line-clamp-1 max-w-[250px]'>
          {desc || '—'}
        </span>
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
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'
              : 'border-rose-500/20 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400'
          }
        >
          {active ? 'Active' : 'Inactive'}
        </Badge>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
