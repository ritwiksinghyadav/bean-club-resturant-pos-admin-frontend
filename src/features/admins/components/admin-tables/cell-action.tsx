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
import {
  IconEdit,
  IconDotsVertical,
  IconTrash,
  IconPower
} from '@tabler/icons-react';
import { Admin } from '../admin-client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchWithAdminAuth } from '@/lib/api-client';

interface CellActionProps {
  data: Admin;
  onEdit: (admin: Admin) => void;
  onDelete: (id: string) => void;
}

export const CellAction: React.FC<CellActionProps> = ({
  data,
  onEdit,
  onDelete
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const token = (session?.user as any)?.accessToken;
  const currentUserId = (session?.user as any)?.id;
  const isSelf = data.id === currentUserId;

  const onToggleStatus = async () => {
    if (isSelf) {
      toast.error('You cannot deactivate your own account.');
      return;
    }

    if (!token) {
      toast.error('Unauthorized. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithAdminAuth(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/admins/${data.id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isActive: !data.isActive })
        }
      );
      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success(
          resData.message ||
            `Admin ${data.isActive ? 'deactivated' : 'activated'} successfully.`
        );
        router.refresh();
      } else {
        toast.error(resData.message || 'Failed to update admin status.');
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
          <DropdownMenuItem
            onClick={onToggleStatus}
            disabled={loading || isSelf}
            className={isSelf ? 'cursor-not-allowed opacity-50' : ''}
            title={isSelf ? 'You cannot deactivate your own account' : ''}
          >
            <IconPower className='mr-2 h-4 w-4' />{' '}
            {data.isActive ? 'Deactivate' : 'Activate'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpen(true)}
            disabled={isSelf}
            className={
              isSelf
                ? 'cursor-not-allowed text-rose-600/50 opacity-50'
                : 'text-rose-600'
            }
            title={isSelf ? 'You cannot delete your own account' : ''}
          >
            <IconTrash className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
