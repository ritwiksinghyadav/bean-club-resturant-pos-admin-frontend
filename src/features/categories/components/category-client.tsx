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
import { Switch } from '@/components/ui/switch';
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

import { CategoryTable } from './category-tables';
import { columns } from './category-tables/columns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export type Category = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().nullable().optional().or(z.literal('')),
  isActive: z.boolean().default(true)
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryClientProps {
  categories: Category[];
  totalItems: number;
}

export default function CategoryClient({ categories: initialCategories, totalItems }: CategoryClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const token = (session?.user as any)?.accessToken;

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true
    }
  });

  const editForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true
    }
  });

  const handleAddSubmit = async (values: CategoryFormValues) => {
    if (!token) {
      toast.error('Unauthorized. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = { name: values.name };
      if (values.description) payload.description = values.description;

      const res = await fetch(`${API_URL}/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Category created successfully.');
        setCategories((prev) => [data.result.category, ...prev]);
        setIsAddOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to create category.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    editForm.reset({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (values: CategoryFormValues) => {
    if (!editingCategory || !token) return;

    setIsLoading(true);
    try {
      const payload: any = {
        name: values.name,
        description: values.description || null,
        isActive: values.isActive
      };

      const res = await fetch(`${API_URL}/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Category updated successfully.');
        setCategories((prev) =>
          prev.map((cat) => (cat.id === editingCategory.id ? data.result.category : cat))
        );
        setIsEditOpen(false);
        setEditingCategory(null);
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to update category.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategoryId || !token) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/categories/${deletingCategoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Category deleted successfully.');
        setCategories((prev) => prev.filter((cat) => cat.id !== deletingCategoryId));
        setDeletingCategoryId(null);
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to delete category.');
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
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground text-sm">
            Manage food and beverage categories for your menu items.
          </p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 text-xs md:text-sm"
        >
          <IconPlus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>
      <Separator />

      <CategoryTable 
        data={categories}
        totalItems={totalItems}
        columns={columns}
        onEdit={handleEditClick}
        onDelete={(id) => setDeletingCategoryId(id)}
      />

      {/* Add Category Modal */}
      <Modal
        title="Add Category"
        description="Create a new food or beverage category."
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
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Specialty Lattes" {...field} />
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
                    <Textarea placeholder="Describe the category..." className="resize-none h-20" {...field} value={field.value ?? ''} />
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

      {/* Edit Category Modal */}
      <Modal
        title="Edit Category"
        description="Update category details."
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingCategory(null);
        }}
      >
        <Form {...editForm}>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4 pt-2">
            <FormField
              control={editForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Specialty Lattes" {...field} />
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
                    <Textarea placeholder="Describe the category..." className="resize-none h-20" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={editForm.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <div className="text-[12px] text-muted-foreground">
                      Whether this category is displayed on the active menu.
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingCategory(null);
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
      <AlertDialog open={!!deletingCategoryId} onOpenChange={(open) => !open && setDeletingCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Removing this category will set the category to null for all associated menu items.
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
