'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MenuItem } from './columns';
import {
  IconEdit,
  IconDotsVertical,
  IconTrash,
  IconPower
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { fetchWithAdminAuth } from '@/lib/api-client';

interface CellActionProps {
  data: MenuItem;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  const onConfirm = async () => {
    if (!token) {
      toast.error('Unauthorized. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithAdminAuth(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/menu-items/${data.id}`,
        {
          method: 'DELETE'
        }
      );
      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success(resData.message || 'Product deleted successfully.');
        setOpen(false);
        router.refresh();
      } else {
        toast.error(resData.message || 'Failed to delete product.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while deleting.');
    } finally {
      setLoading(false);
    }
  };

  const onToggleStatus = async () => {
    if (!token) {
      toast.error('Unauthorized. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithAdminAuth(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/menu-items/${data.id}`,
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
            `Product ${data.isActive ? 'deactivated' : 'activated'} successfully.`
        );
        router.refresh();
      } else {
        toast.error(resData.message || 'Failed to update product status.');
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
        onConfirm={onConfirm}
        loading={loading}
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

          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/product/${data.id}`)}
          >
            <IconEdit className='mr-2 h-4 w-4' /> Update
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleStatus} disabled={loading}>
            <IconPower className='mr-2 h-4 w-4' />{' '}
            {data.isActive ? 'Deactivate' : 'Activate'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <IconTrash className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
