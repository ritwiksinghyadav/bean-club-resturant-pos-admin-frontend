'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  IconLoader2, 
  IconCoins,
  IconPlus,
  IconMinus
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { Separator } from '@/components/ui/separator';

import { LoyaltyTable } from './loyalty-tables';
import { columns, LoyaltyCustomer } from './loyalty-tables/columns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const adjustPointsSchema = z.object({
  points: z.coerce.number().min(1, 'Points must be at least 1'),
  description: z.string().optional()
});

type AdjustPointsFormValues = z.infer<typeof adjustPointsSchema>;

interface LoyaltyClientProps {
  users: LoyaltyCustomer[];
  totalItems: number;
}

export default function LoyaltyClient({ users: initialUsers, totalItems }: LoyaltyClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const token = (session?.user as any)?.accessToken;

  const [usersList, setUsersList] = useState<LoyaltyCustomer[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<LoyaltyCustomer | null>(null);
  const [adjustType, setAdjustType] = useState<'grant' | 'deduct'>('grant');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setUsersList(initialUsers);
  }, [initialUsers]);

  const adjustForm = useForm<AdjustPointsFormValues>({
    resolver: zodResolver(adjustPointsSchema),
    defaultValues: {
      points: 1,
      description: ''
    }
  });

  const handleAdjustPointsClick = (user: LoyaltyCustomer) => {
    setSelectedUser(user);
    setAdjustType('grant');
    adjustForm.reset({
      points: 1,
      description: ''
    });
  };

  const handleAdjustSubmit = async (values: AdjustPointsFormValues) => {
    if (!selectedUser || !token) {
      toast.error('Unauthorized. Please log in again.');
      return;
    }

    const pointsNum = adjustType === 'grant' ? values.points : -values.points;

    if (adjustType === 'deduct' && selectedUser.pointsBalance + pointsNum < 0) {
      toast.error(`Cannot deduct ${values.points} points. Customer only has ${selectedUser.pointsBalance} points.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${selectedUser.id}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          points: pointsNum,
          description: values.description || (adjustType === 'grant' ? 'Manual adjustment (Grant)' : 'Manual adjustment (Deduction)')
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Loyalty balance updated for ${selectedUser.name}.`);
        
        // Update local list state
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? { ...u, pointsBalance: u.pointsBalance + pointsNum }
              : u
          )
        );
        setSelectedUser(null);
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to update points.');
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
          <h2 className="text-3xl font-bold tracking-tight">Customer Loyalty Points</h2>
          <p className="text-muted-foreground text-sm">
            Monitor points balances and adjust customer loyalty balances directly.
          </p>
        </div>
      </div>
      <Separator />

      <LoyaltyTable 
        data={usersList}
        totalItems={totalItems}
        columns={columns}
        onAdjustPoints={handleAdjustPointsClick}
      />

      {/* Adjust Points Modal */}
      <Modal
        title="Adjust Loyalty Points Balance"
        description={`Modify points balance for ${selectedUser?.name || 'Customer'}`}
        isOpen={!!selectedUser}
        onClose={() => {
          setSelectedUser(null);
        }}
      >
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm font-semibold flex justify-between items-center mb-4">
          <span className="text-muted-foreground">Current Balance:</span>
          <span className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <IconCoins className="w-4 h-4" /> {selectedUser?.pointsBalance || 0} pts
          </span>
        </div>

        <Form {...adjustForm}>
          <form onSubmit={adjustForm.handleSubmit(handleAdjustSubmit)} className="space-y-4">
            {/* Toggle Grant vs Deduct */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={adjustType === 'grant' ? 'default' : 'outline'}
                onClick={() => setAdjustType('grant')}
                className={`w-full font-bold flex items-center gap-1.5 h-11 ${
                  adjustType === 'grant' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                    : ''
                }`}
              >
                <IconPlus className="w-4 h-4" /> Grant Points
              </Button>
              <Button
                type="button"
                variant={adjustType === 'deduct' ? 'default' : 'outline'}
                onClick={() => setAdjustType('deduct')}
                className={`w-full font-bold flex items-center gap-1.5 h-11 ${
                  adjustType === 'deduct' 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600' 
                    : ''
                }`}
              >
                <IconMinus className="w-4 h-4" /> Deduct Points
              </Button>
            </div>

            <FormField
              control={adjustForm.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points Count</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" placeholder="e.g. 50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={adjustForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason / Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Counter transaction correction" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedUser(null)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className={adjustType === 'grant' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
              >
                {isLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Confirm Adjustments'}
              </Button>
            </div>
          </form>
        </Form>
      </Modal>
    </div>
  );
}
