'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconCoins } from '@tabler/icons-react';
import { LoyaltyCustomer } from './columns';

interface CellActionProps {
  data: LoyaltyCustomer;
  onAdjustPoints: (user: LoyaltyCustomer) => void;
}

export const CellAction: React.FC<CellActionProps> = ({ data, onAdjustPoints }) => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>Open menu</span>
          <IconDotsVertical className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAdjustPoints(data)}>
          <IconCoins className='mr-2 h-4 w-4 text-amber-500' /> Adjust Points
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
