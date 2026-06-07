'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  IconPlus, 
  IconLoader2 
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
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

import { VariantTable } from './variant-tables';
import { columns } from './variant-tables/columns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export type Variant = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

const variantSchema = z.object({
  name: z.string().min(1, 'Name is required (e.g. Regular, Large, XL, Grande)'),
  description: z.string().nullable().optional().or(z.literal(''))
});

type VariantFormValues = z.infer<typeof variantSchema>;

interface VariantClientProps {
  variants: Variant[];
  totalItems: number;
}

export default function VariantClient({ variants: initialVariants, totalItems }: VariantClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const token = (session?.user as any)?.accessToken;

  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setVariants(initialVariants);
  }, [initialVariants]);

  const form = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const editForm = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const handleAddSubmit = async (values: VariantFormValues) => {
    if (!token) {
      toast.error('Unauthorized. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = { name: values.name };
      if (values.description) payload.description = values.description;

      const res = await fetch(`${API_URL}/admin/variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Variant created successfully.');
        setVariants((prev) => [data.result.variant, ...prev]);
        setIsAddOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to create variant.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (variant: Variant) => {
    setEditingVariant(variant);
    editForm.reset({
      name: variant.name,
      description: variant.description || ''
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (values: VariantFormValues) => {
    if (!editingVariant || !token) return;

    setIsLoading(true);
    try {
      const payload: any = {
        name: values.name,
        description: values.description || null
      };

      const res = await fetch(`${API_URL}/admin/variants/${editingVariant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Variant updated successfully.');
        setVariants((prev) =>
          prev.map((v) => (v.id === editingVariant.id ? data.result.variant : v))
        );
        setIsEditOpen(false);
        setEditingVariant(null);
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to update variant.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVariantId || !token) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/variants/${deletingVariantId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Variant deleted successfully.');
        setVariants((prev) => prev.filter((v) => v.id !== deletingVariantId));
        setDeletingVariantId(null);
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to delete variant.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sizing Variants</h2>
          <p className="text-muted-foreground text-sm">
            Manage global master sizing types (e.g. Regular, Large, XL, Grande) for the menu.
          </p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 text-xs md:text-sm"
        >
          <IconPlus className="mr-2 h-4 w-4" /> Add Sizing Variant
        </Button>
      </div>
      <Separator />

      <VariantTable 
        data={variants}
        totalItems={totalItems}
        columns={columns}
        onEdit={handleEditClick}
        onDelete={(id) => setDeletingVariantId(id)}
      />

      {/* Add Variant Modal */}
      <Modal
        title="Add Sizing Variant"
        description="Create a new global sizing variant."
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          form.reset();
        }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Grande / XL / Regular" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the size..." className="resize-none h-20" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  form.reset();
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-[80px]"
              >
                {isLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </Modal>

      {/* Edit Variant Modal */}
      <Modal
        title="Edit Sizing Variant"
        description="Update global sizing variant details."
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingVariant(null);
        }}
      >
        <Form {...editForm}>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4 pt-2">
            <FormField
              control={editForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Grande / XL / Regular" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={editForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the size..." className="resize-none h-20" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingVariant(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-[80px]"
              >
                {isLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingVariantId} onOpenChange={(open) => !open && setDeletingVariantId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Removing this global sizing variant will automatically unmap it and delete its pricing configuration from all menu items.
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
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
