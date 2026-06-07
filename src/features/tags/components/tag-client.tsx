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

import { TagTable } from './tag-tables';
import { columns } from './tag-tables/columns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export type Tag = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

const tagSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().nullable().optional().or(z.literal(''))
});

type TagFormValues = z.infer<typeof tagSchema>;

interface TagClientProps {
  tags: Tag[];
  totalItems: number;
}

export default function TagClient({ tags: initialTags, totalItems }: TagClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const token = (session?.user as any)?.accessToken;

  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const editForm = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const handleAddSubmit = async (values: TagFormValues) => {
    if (!token) {
      toast.error('Unauthorized. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = { name: values.name };
      if (values.description) payload.description = values.description;

      const res = await fetch(`${API_URL}/admin/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Tag created successfully.');
        setTags((prev) => [data.result.tag, ...prev]);
        setIsAddOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to create tag.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (tag: Tag) => {
    setEditingTag(tag);
    editForm.reset({
      name: tag.name,
      description: tag.description || ''
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (values: TagFormValues) => {
    if (!editingTag || !token) return;

    setIsLoading(true);
    try {
      const payload: any = {
        name: values.name,
        description: values.description || null
      };

      const res = await fetch(`${API_URL}/admin/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Tag updated successfully.');
        setTags((prev) =>
          prev.map((t) => (t.id === editingTag.id ? data.result.tag : t))
        );
        setIsEditOpen(false);
        setEditingTag(null);
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to update tag.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTagId || !token) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/tags/${deletingTagId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Tag deleted successfully.');
        setTags((prev) => prev.filter((t) => t.id !== deletingTagId));
        setDeletingTagId(null);
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to delete tag.');
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
          <h2 className="text-3xl font-bold tracking-tight">Tags</h2>
          <p className="text-muted-foreground text-sm">
            Manage tags to label and categorize menu items.
          </p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 text-xs md:text-sm"
        >
          <IconPlus className="mr-2 h-4 w-4" /> Add Tag
        </Button>
      </div>
      <Separator />

      <TagTable 
        data={tags}
        totalItems={totalItems}
        columns={columns}
        onEdit={handleEditClick}
        onDelete={(id) => setDeletingTagId(id)}
      />

      {/* Add Tag Modal */}
      <Modal
        title="Add Tag"
        description="Create a new tag for menu items."
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
                  <FormLabel>Tag Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Spicy / Hot" {...field} />
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
                    <Textarea placeholder="Describe the tag..." className="resize-none h-20" {...field} value={field.value ?? ''} />
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

      {/* Edit Tag Modal */}
      <Modal
        title="Edit Tag"
        description="Update tag details."
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingTag(null);
        }}
      >
        <Form {...editForm}>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4 pt-2">
            <FormField
              control={editForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Spicy / Hot" {...field} />
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
                    <Textarea placeholder="Describe the tag..." className="resize-none h-20" {...field} value={field.value ?? ''} />
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
                  setEditingTag(null);
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
      <AlertDialog open={!!deletingTagId} onOpenChange={(open) => !open && setDeletingTagId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Removing this tag will automatically detach it from all menu items.
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
