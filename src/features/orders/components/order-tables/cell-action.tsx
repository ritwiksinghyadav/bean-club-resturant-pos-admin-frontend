'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, CircleCheck, ChefHat } from 'lucide-react';
import { Order } from '../order-client';

interface CellActionProps {
  data: Order;
  onUpdateStatus: (orderId: string, status: string) => void;
}

export const CellAction: React.FC<CellActionProps> = ({ data, onUpdateStatus }) => {
  return (
    <div className="flex items-center justify-end gap-2">
      {data.status === 'pending' && (
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white text-[10px] h-7 px-2"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateStatus(data.id, 'preparing');
          }}
        >
          <Check className="w-3.5 h-3.5 mr-1" />
          Approve
        </Button>
      )}

      {data.status === 'approved' && (
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] h-7 px-2"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateStatus(data.id, 'preparing');
          }}
        >
          <ChefHat className="w-3.5 h-3.5 mr-1" />
          To Kitchen
        </Button>
      )}

      {data.status === 'preparing' && (
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-7 px-2"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateStatus(data.id, 'completed');
          }}
        >
          <CircleCheck className="w-3.5 h-3.5 mr-1" />
          Mark as Ready
        </Button>
      )}
    </div>
  );
};
