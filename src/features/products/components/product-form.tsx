'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { fetchWithAdminAuth } from '@/lib/api-client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  IconPlus,
  IconTrash,
  IconLoader2,
  IconArrowLeft,
  IconCheck,
  IconEdit
} from '@tabler/icons-react';
import Link from 'next/link';

import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MenuItem, MenuItemVariant } from './product-tables/columns';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Product name must be at least 2 characters.'
  }),
  categoryId: z.string().nullable().optional().or(z.literal('')),
  basePrice: z.coerce.number().positive('Price must be a positive number'),
  description: z.string().optional().or(z.literal('')),
  imageUrl: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true)
});

type ProductFormValues = z.infer<typeof formSchema>;

// Variant creation schema
const variantSchema = z.object({
  variantId: z.string().min(1, 'Sizing variant is required'),
  price: z.coerce.number().positive('Price must be a positive number')
});

type VariantFormValues = z.infer<typeof variantSchema>;

const editVariantSchema = z.object({
  price: z.coerce.number().positive('Price must be a positive number')
});

type EditVariantFormValues = z.infer<typeof editVariantSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  description: string | null;
}

interface MasterVariant {
  id: string;
  name: string;
  description: string | null;
}

interface ProductFormProps {
  initialData: MenuItem | null;
  categories: Category[];
  tags: Tag[];
  masterVariants: MasterVariant[];
  pageTitle: string;
  isModal?: boolean;
  onSuccess?: () => void;
}

export default function ProductForm({
  initialData,
  categories,
  tags = [],
  masterVariants = [],
  pageTitle,
  isModal = false,
  onSuccess
}: ProductFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const token = (session?.user as any)?.accessToken;

  const [isLoading, setIsLoading] = useState(false);
  const [variants, setVariants] = useState<MenuItemVariant[]>(
    initialData?.variants || []
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tags?.map((t) => t.id) || []
  );
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<MenuItemVariant | null>(
    null
  );
  const [isEditVariantModalOpen, setIsEditVariantModalOpen] = useState(false);
  const [variantLoading, setVariantLoading] = useState(false);

  const defaultValues = {
    name: initialData?.name || '',
    categoryId: initialData?.categoryId || '',
    basePrice: initialData ? parseFloat(initialData.basePrice) : 0,
    description: initialData?.description || '',
    imageUrl: initialData?.imageUrl || '',
    isActive: initialData ? initialData.isActive : true
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const variantForm = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      variantId: '',
      price: 0
    }
  });

  const editVariantForm = useForm<EditVariantFormValues>({
    resolver: zodResolver(editVariantSchema),
    defaultValues: {
      price: 0
    }
  });

  const onSubmit = async (values: ProductFormValues) => {
    if (!token) {
      toast.error('Unauthorized. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: values.name,
        categoryId: values.categoryId || null,
        basePrice: values.basePrice,
        description: values.description || null,
        imageUrl: values.imageUrl || null,
        isActive: values.isActive,
        tagIds: selectedTagIds
      };

      let res;
      if (initialData) {
        // Edit mode
        res = await fetchWithAdminAuth(
          `${API_URL}/admin/menu-items/${initialData.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }
        );
      } else {
        // Create mode
        res = await fetchWithAdminAuth(`${API_URL}/admin/menu-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success(resData.message || 'Product saved successfully.');
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard/product');
          router.refresh();
        }
      } else {
        toast.error(resData.message || 'Failed to save product.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while saving the product.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVariantSubmit = async (values: VariantFormValues) => {
    if (!initialData || !token) return;

    setVariantLoading(true);
    try {
      const payload = {
        menuItemId: initialData.id,
        variantId: values.variantId,
        price: values.price
      };

      const res = await fetchWithAdminAuth(
        `${API_URL}/admin/menu-items/variants`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success(resData.message || 'Variant added successfully.');
        setVariants((prev) => [...prev, resData.result.itemVariant]);
        setIsVariantModalOpen(false);
        variantForm.reset({ variantId: '', price: 0 });
        router.refresh();
      } else {
        toast.error(resData.message || 'Failed to add variant.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while creating variant.');
    } finally {
      setVariantLoading(false);
    }
  };

  const handleEditVariantSubmit = async (values: EditVariantFormValues) => {
    if (!editingVariant || !token) return;

    setVariantLoading(true);
    try {
      const payload = {
        price: values.price
      };

      const res = await fetchWithAdminAuth(
        `${API_URL}/admin/menu-items/variants/${editingVariant.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success(resData.message || 'Variant updated successfully.');
        setVariants((prev) =>
          prev.map((v) =>
            v.id === editingVariant.id
              ? { ...v, price: values.price.toString() }
              : v
          )
        );
        setIsEditVariantModalOpen(false);
        setEditingVariant(null);
        router.refresh();
      } else {
        toast.error(resData.message || 'Failed to update variant.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while updating variant.');
    } finally {
      setVariantLoading(false);
    }
  };

  const handleEditVariantClick = (variant: MenuItemVariant) => {
    setEditingVariant(variant);
    editVariantForm.reset({
      price: parseFloat(variant.price)
    });
    setIsEditVariantModalOpen(true);
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!token) return;

    try {
      const res = await fetchWithAdminAuth(
        `${API_URL}/admin/menu-items/variants/${variantId}`,
        {
          method: 'DELETE'
        }
      );

      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success(resData.message || 'Variant deleted successfully.');
        setVariants((prev) => prev.filter((v) => v.id !== variantId));
        router.refresh();
      } else {
        toast.error(resData.message || 'Failed to delete variant.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while deleting variant.');
    }
  };

  const handleToggleVariantStatus = async (
    variantId: string,
    isActive: boolean
  ) => {
    if (!token) return;

    try {
      const res = await fetchWithAdminAuth(
        `${API_URL}/admin/menu-items/variants/${variantId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isActive })
        }
      );

      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success('Variant status updated successfully.');
        setVariants((prev) =>
          prev.map((v) => (v.id === variantId ? { ...v, isActive } : v))
        );
        router.refresh();
      } else {
        toast.error(resData.message || 'Failed to update variant status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while updating variant status.');
    }
  };

  if (isModal) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. Vanilla Cold Brew' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='categoryId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === 'none' ? null : value)
                    }
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a category' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='none'>Uncategorized</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='basePrice'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Price (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.01'
                      placeholder='e.g. 4.50'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='imageUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g. https://images.unsplash.com/...'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Describe this product...'
                    className='h-20 resize-none'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex justify-end space-x-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={onSuccess}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isLoading}
              className='min-w-[100px]'
            >
              {isLoading ? (
                <IconLoader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Create Product'
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <Link
            href='/dashboard/product'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'icon' }),
              'h-8 w-8'
            )}
          >
            <IconArrowLeft className='h-4 w-4' />
          </Link>
          <h2 className='from-primary to-primary/80 bg-gradient-to-r bg-clip-text text-3xl font-bold tracking-tight text-transparent'>
            {pageTitle}
          </h2>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Left Side: Product Fields & Tags */}
        <div className='space-y-6 lg:col-span-2'>
          <Card className='bg-card/60 border shadow-md backdrop-blur-sm'>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>
                Fill out the product information below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  id='product-form'
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='space-y-6'
                >
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='e.g. Vanilla Cold Brew'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='categoryId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category (Optional)</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(value === 'none' ? null : value)
                            }
                            value={field.value || 'none'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select a category' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='none'>
                                Uncategorized
                              </SelectItem>
                              {categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='basePrice'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Price (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              placeholder='e.g. 4.50'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='imageUrl'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='e.g. https://images.unsplash.com/...'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='description'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='Describe this product...'
                            className='h-24 resize-none'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {initialData && (
                    <FormField
                      control={form.control}
                      name='isActive'
                      render={({ field }) => (
                        <FormItem className='bg-muted/20 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                          <div className='space-y-0.5'>
                            <FormLabel>Active Status</FormLabel>
                            <div className='text-muted-foreground text-[12px]'>
                              Whether this menu item is shown to customers.
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
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Tags Mapping Card */}
          <Card className='bg-card/60 border shadow-md backdrop-blur-sm'>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Select tags to categorize this product.
              </CardDescription>
            </CardHeader>
            <CardContent className='border-t pt-4'>
              {tags.length === 0 ? (
                <p className='text-muted-foreground text-sm'>
                  No tags configured. Create tags under the Tags screen first.
                </p>
              ) : (
                <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
                  {tags.map((tag) => {
                    const isChecked = selectedTagIds.includes(tag.id);
                    return (
                      <div
                        key={tag.id}
                        className={cn(
                          'hover:bg-muted/50 flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors',
                          isChecked && 'border-primary bg-primary/5'
                        )}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedTagIds((prev) =>
                              prev.filter((id) => id !== tag.id)
                            );
                          } else {
                            setSelectedTagIds((prev) => [...prev, tag.id]);
                          }
                        }}
                      >
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={isChecked}
                          onCheckedChange={() => {}} // Controlled by the card div click
                        />
                        <span className='cursor-pointer text-sm font-medium select-none'>
                          {tag.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Variant Management (Only if product exists) */}
        <div className='space-y-6'>
          <Card className='bg-card/60 border shadow-md backdrop-blur-sm'>
            <CardHeader>
              <CardTitle>Image Preview</CardTitle>
              <CardDescription>
                Visual look of your menu item card.
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col items-center justify-center border-t p-6'>
              <div className='bg-muted group relative flex h-48 w-full max-w-[240px] items-center justify-center overflow-hidden rounded-2xl border shadow-inner'>
                {form.watch('imageUrl') ? (
                  <img
                    src={form.watch('imageUrl') || ''}
                    alt='Preview'
                    className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                  />
                ) : (
                  <div className='text-muted-foreground flex flex-col items-center justify-center p-4'>
                    <span className='text-primary/30 text-[40px] font-bold'>
                      Bean
                    </span>
                    <span className='text-muted-foreground/60 text-xs'>
                      No image URL specified
                    </span>
                  </div>
                )}
              </div>
              <div className='mt-4 text-center'>
                <span className='block text-lg font-bold'>
                  {form.watch('name') || 'Product Name'}
                </span>
                <span className='text-primary block text-sm font-bold'>
                  $
                  {form.watch('basePrice')
                    ? Number(form.watch('basePrice')).toFixed(2)
                    : '0.00'}
                </span>
              </div>
            </CardContent>
          </Card>

          {initialData ? (
            <Card className='bg-card/60 border shadow-md backdrop-blur-sm'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0'>
                <div>
                  <CardTitle>Product Variants</CardTitle>
                  <CardDescription>
                    Sizes, toppings, or custom versions.
                  </CardDescription>
                </div>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setIsVariantModalOpen(true)}
                  className='h-8'
                >
                  <IconPlus className='mr-1 h-4 w-4' /> Add
                </Button>
              </CardHeader>
              <CardContent className='border-t p-0'>
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader className='bg-muted/30'>
                      <TableRow>
                        <TableHead className='pl-4'>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className='w-20'>Status</TableHead>
                        <TableHead className='w-24 pr-4 text-right'></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className='text-muted-foreground h-20 text-center'
                          >
                            No variants yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        variants.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell className='pl-4 font-medium'>
                              {v.name}
                            </TableCell>
                            <TableCell className='font-mono text-emerald-600'>
                              ${parseFloat(v.price).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={v.isActive}
                                onCheckedChange={(checked) =>
                                  handleToggleVariantStatus(v.id, checked)
                                }
                              />
                            </TableCell>
                            <TableCell className='flex items-center justify-end space-x-1 pr-4 text-right'>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => handleEditVariantClick(v)}
                                className='text-primary hover:bg-primary/10 h-8 w-8'
                              >
                                <IconEdit className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => handleDeleteVariant(v.id)}
                                className='h-8 w-8 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700'
                              >
                                <IconTrash className='h-4 w-4' />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className='bg-muted/20 border border-dashed shadow-md'>
              <CardContent className='text-muted-foreground p-6 text-center'>
                <p className='text-sm font-semibold'>Variant Management</p>
                <p className='mt-1 text-xs'>
                  Variants can be created once you click &quot;Save
                  Product&quot;.
                </p>
              </CardContent>
            </Card>
          )}

          <div className='flex justify-end space-x-2 pt-4'>
            <Link
              href='/dashboard/product'
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              Cancel
            </Link>
            <Button
              type='submit'
              form='product-form'
              disabled={isLoading}
              className='min-w-[120px]'
            >
              {isLoading ? (
                <IconLoader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Save Product'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Add Variant Modal */}
      {initialData && (
        <Modal
          title='Add Product Variant'
          description={`Map a global sizing variant to ${initialData.name}`}
          isOpen={isVariantModalOpen}
          onClose={() => {
            setIsVariantModalOpen(false);
            variantForm.reset();
          }}
        >
          <Form {...variantForm}>
            <form
              onSubmit={variantForm.handleSubmit(handleAddVariantSubmit)}
              className='space-y-4 pt-2'
            >
              <FormField
                control={variantForm.control}
                name='variantId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sizing Variant</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select sizing variant' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {masterVariants
                          .filter(
                            (mv) => !variants.some((v) => v.variantId === mv.id)
                          )
                          .map((mv) => (
                            <SelectItem key={mv.id} value={mv.id}>
                              {mv.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={variantForm.control}
                name='price'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variant Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.01'
                        placeholder='e.g. 5.50'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex justify-end space-x-2 pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setIsVariantModalOpen(false);
                    variantForm.reset();
                  }}
                  disabled={variantLoading}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={variantLoading}
                  className='min-w-[80px]'
                >
                  {variantLoading ? (
                    <IconLoader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    'Add'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Modal>
      )}

      {/* Edit Variant Modal */}
      {initialData && (
        <Modal
          title='Edit Product Variant'
          description={`Update price for variant ${editingVariant?.name || ''}`}
          isOpen={isEditVariantModalOpen}
          onClose={() => {
            setIsEditVariantModalOpen(false);
            setEditingVariant(null);
          }}
        >
          <Form {...editVariantForm}>
            <form
              onSubmit={editVariantForm.handleSubmit(handleEditVariantSubmit)}
              className='space-y-4 pt-2'
            >
              <FormField
                control={editVariantForm.control}
                name='price'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variant Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.01'
                        placeholder='e.g. 5.50'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex justify-end space-x-2 pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setIsEditVariantModalOpen(false);
                    setEditingVariant(null);
                  }}
                  disabled={variantLoading}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={variantLoading}
                  className='min-w-[80px]'
                >
                  {variantLoading ? (
                    <IconLoader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Modal>
      )}
    </div>
  );
}
