'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { AlertModal } from '@/components/modal/alert-modal';
import { IconEdit, IconDotsVertical, IconTrash, IconPower } from '@tabler/icons-react';
import { Category } from '../category-client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface CellActionProps {
  data: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export const CellAction: React.FC<CellActionProps> = ({ data, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  const onToggleStatus = async () => {
    if (!token) {
      toast.error('Unauthorized. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/categories/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !data.isActive })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success(resData.message || `Category ${data.isActive ? 'deactivated' : 'activated'} successfully.`);
        router.refresh();
      } else {
        toast.error(resData.message || 'Failed to update category status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while updating status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          onDelete(data.id);
          setOpen(false);
        }}
        loading={false}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onEdit(data)}>
            <IconEdit className='mr-2 h-4 w-4' /> Update
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleStatus} disabled={loading}>
            <IconPower className='mr-2 h-4 w-4' /> {data.isActive ? 'Deactivate' : 'Activate'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <IconTrash className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
