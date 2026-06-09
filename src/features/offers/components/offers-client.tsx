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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { OfferTable } from './offers-tables';
import { columns } from './offers-tables/columns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export type Offer = {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  maxDiscount: string | null;
  minBillAmount: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const offerSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').transform(val => val.toUpperCase()),
  description: z.string().min(1, 'Description is required'),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().positive('Discount value must be a positive number'),
  maxDiscount: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.coerce.number().positive('Max discount must be a positive number').nullable().optional()
  ),
  minBillAmount: z.coerce.number().nonnegative('Minimum bill amount cannot be negative').default(0),
  isActive: z.boolean().default(true)
});

type OfferFormValues = z.infer<typeof offerSchema>;

interface OfferClientProps {
  offers: Offer[];
  totalItems: number;
}

export default function OfferClient({ offers: initialOffers, totalItems }: OfferClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const token = (session?.user as any)?.accessToken;

  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setOffers(initialOffers);
  }, [initialOffers]);

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      maxDiscount: null,
      minBillAmount: 0,
      isActive: true
    }
  });

  const editForm = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      maxDiscount: null,
      minBillAmount: 0,
      isActive: true
    }
  });

  // Watch discountType to conditionally show/hide maxDiscount field
  const addDiscountType = form.watch('discountType');
  const editDiscountType = editForm.watch('discountType');

  const handleAddSubmit = async (values: OfferFormValues) => {
    if (!token) {
      toast.error('Unauthorized. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Offer created successfully.');
        setOffers((prev) => [data.result.offer, ...prev]);
        setIsAddOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to create offer.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (offer: Offer) => {
    setEditingOffer(offer);
    editForm.reset({
      code: offer.code,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: parseFloat(offer.discountValue),
      maxDiscount: offer.maxDiscount ? parseFloat(offer.maxDiscount) : null,
      minBillAmount: parseFloat(offer.minBillAmount),
      isActive: offer.isActive
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (values: OfferFormValues) => {
    if (!editingOffer || !token) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/offers/${editingOffer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Offer updated successfully.');
        setOffers((prev) =>
          prev.map((o) => (o.id === editingOffer.id ? data.result.offer : o))
        );
        setIsEditOpen(false);
        setEditingOffer(null);
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to update offer.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingOfferId || !token) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/offers/${deletingOfferId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Offer deleted successfully.');
        setOffers((prev) => prev.filter((o) => o.id !== deletingOfferId));
        setDeletingOfferId(null);
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to delete offer.');
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
          <h2 className="text-3xl font-bold tracking-tight">Offers &amp; Coupons</h2>
          <p className="text-muted-foreground text-sm">
            Manage restaurant promo codes, fixed and percentage discounts.
          </p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 text-xs md:text-sm"
        >
          <IconPlus className="mr-2 h-4 w-4" /> Add Offer
        </Button>
      </div>
      <Separator />

      <OfferTable 
        data={offers}
        totalItems={totalItems}
        columns={columns}
        onEdit={handleEditClick}
        onDelete={(id) => setDeletingOfferId(id)}
      />

      {/* Add Offer Modal */}
      <Modal
        title="Add Offer"
        description="Create a new discount offer/coupon code."
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          form.reset();
        }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. WELCOME50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Value</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50 or 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDiscount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Discount Cap</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={addDiscountType === 'percentage' ? "e.g. 200" : "N/A"} 
                        disabled={addDiscountType !== 'percentage'} 
                        {...field} 
                        value={field.value ?? ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minBillAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Bill Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 300" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. 50% off up to ₹200 on orders above ₹300" className="resize-none h-16" {...field} />
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

      {/* Edit Offer Modal */}
      <Modal
        title="Edit Offer"
        description="Update discount offer details."
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingOffer(null);
        }}
      >
        <Form {...editForm}>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. WELCOME50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={editForm.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Value</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50 or 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="maxDiscount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Discount Cap</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={editDiscountType === 'percentage' ? "e.g. 200" : "N/A"} 
                        disabled={editDiscountType !== 'percentage'} 
                        {...field} 
                        value={field.value ?? ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="minBillAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Bill Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 300" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={editForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. 50% off up to ₹200 on orders above ₹300" className="resize-none h-16" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3.5 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <p className="text-[11px] text-muted-foreground">
                      Enable or disable this coupon code.
                    </p>
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
                  setEditingOffer(null);
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
      <AlertDialog open={!!deletingOfferId} onOpenChange={(open) => !open && setDeletingOfferId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Removing this offer will delete it permanently and it will no longer be available for checkouts.
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
