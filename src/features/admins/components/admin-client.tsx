'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { fetchWithAdminAuth } from '@/lib/api-client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { IconPlus, IconLoader2 } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';

import { AdminTable } from './admin-tables';
import { columns } from './admin-tables/columns';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export type Role = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Admin = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  roleId: string;
  role: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
};

const addAdminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleId: z.string().min(1, 'Role is required')
});

const editAdminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional().or(z.literal('')),
  roleId: z.string().min(1, 'Role is required'),
  isActive: z.boolean().default(true)
});

type AddAdminFormValues = z.infer<typeof addAdminSchema>;
type EditAdminFormValues = z.infer<typeof editAdminSchema>;

interface AdminClientProps {
  admins: Admin[];
  roles: Role[];
  totalItems: number;
}

export default function AdminClient({
  admins: initialAdmins,
  roles,
  totalItems
}: AdminClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const token = (session?.user as any)?.accessToken;
  const currentUserId = (session?.user as any)?.id;

  const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setAdmins(initialAdmins);
  }, [initialAdmins]);

  const addForm = useForm<AddAdminFormValues>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      roleId: ''
    }
  });

  const editForm = useForm<EditAdminFormValues>({
    resolver: zodResolver(editAdminSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      roleId: '',
      isActive: true
    }
  });

  const handleAddSubmit = async (values: AddAdminFormValues) => {
    if (!token) {
      toast.error('Unauthorized. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetchWithAdminAuth(`${API_URL}/admin/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Admin account created successfully.');
        setAdmins((prev) => [data.result.admin, ...prev]);
        setIsAddOpen(false);
        addForm.reset();
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to create admin.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (admin: Admin) => {
    setEditingAdmin(admin);
    editForm.reset({
      name: admin.name,
      email: admin.email,
      password: '',
      roleId: admin.roleId,
      isActive: admin.isActive
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (values: EditAdminFormValues) => {
    if (!editingAdmin || !token) return;

    if (editingAdmin.id === currentUserId && !values.isActive) {
      toast.error('You cannot deactivate your own account.');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        name: values.name,
        email: values.email,
        roleId: values.roleId,
        isActive: values.isActive
      };

      if (values.password && values.password.trim() !== '') {
        payload.password = values.password;
      }

      const res = await fetchWithAdminAuth(
        `${API_URL}/admin/admins/${editingAdmin.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Admin account updated successfully.');
        setAdmins((prev) =>
          prev.map((adm) =>
            adm.id === editingAdmin.id ? data.result.admin : adm
          )
        );
        setIsEditOpen(false);
        setEditingAdmin(null);
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to update admin.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAdminId || !token) return;

    if (deletingAdminId === currentUserId) {
      toast.error('You cannot delete your own account.');
      setDeletingAdminId(null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetchWithAdminAuth(
        `${API_URL}/admin/admins/${deletingAdminId}`,
        {
          method: 'DELETE'
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Admin account deleted successfully.');
        setAdmins((prev) => prev.filter((adm) => adm.id !== deletingAdminId));
        setDeletingAdminId(null);
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to delete admin.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>
            Admin Management
          </h2>
          <p className='text-muted-foreground text-sm'>
            Add, update roles, toggle access status, and delete administrators.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className='text-xs shadow-md transition-all duration-300 hover:shadow-lg active:scale-95 md:text-sm'
        >
          <IconPlus className='mr-2 h-4 w-4' /> Add Admin
        </Button>
      </div>
      <Separator />

      <AdminTable
        data={admins}
        totalItems={totalItems}
        columns={columns}
        onEdit={handleEditClick}
        onDelete={(id) => setDeletingAdminId(id)}
      />

      {/* Add Admin Modal */}
      <Modal
        title='Add Administrator'
        description='Register a new admin, kitchen-staff, or superadmin user.'
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          addForm.reset();
        }}
      >
        <Form {...addForm}>
          <form
            onSubmit={addForm.handleSubmit(handleAddSubmit)}
            className='space-y-4 pt-2'
          >
            <FormField
              control={addForm.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. John Doe' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addForm.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='e.g. john@beanclub.com'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addForm.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='At least 6 characters'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addForm.control}
              name='roleId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Assign a role' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem
                          key={role.id}
                          value={role.id}
                          className='capitalize'
                        >
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-end space-x-2 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsAddOpen(false);
                  addForm.reset();
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isLoading}
                className='min-w-[80px]'
              >
                {isLoading ? (
                  <IconLoader2 className='h-4 w-4 animate-spin' />
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Modal>

      {/* Edit Admin Modal */}
      <Modal
        title='Edit Administrator'
        description='Update account details and role classifications.'
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingAdmin(null);
        }}
      >
        <Form {...editForm}>
          <form
            onSubmit={editForm.handleSubmit(handleEditSubmit)}
            className='space-y-4 pt-2'
          >
            <FormField
              control={editForm.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. John Doe' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={editForm.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='e.g. john@beanclub.com'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={editForm.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='Leave blank to keep current password'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={editForm.control}
              name='roleId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Assign a role' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem
                          key={role.id}
                          value={role.id}
                          className='capitalize'
                        >
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={editForm.control}
              name='isActive'
              render={({ field }) => (
                <FormItem className='bg-muted/20 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                  <div className='space-y-0.5'>
                    <FormLabel>Access Active Status</FormLabel>
                    <div className='text-muted-foreground text-[12px]'>
                      Enable or disable access to the POS dashboards.
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={editingAdmin?.id === currentUserId}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className='flex justify-end space-x-2 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingAdmin(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isLoading}
                className='min-w-[80px]'
              >
                {isLoading ? (
                  <IconLoader2 className='h-4 w-4 animate-spin' />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingAdminId}
        onOpenChange={(open) => !open && setDeletingAdminId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-destructive'>
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Removing this administrator will
              permanently deactivate and delete their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={isLoading}
              className='bg-rose-600 text-white hover:bg-rose-700'
            >
              {isLoading ? (
                <IconLoader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
