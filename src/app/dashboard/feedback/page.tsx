'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';
import {
  Star,
  Trash2,
  MessageSquare,
  Loader2,
  Calendar,
  Phone,
  User,
  X
} from 'lucide-react';
import { ViewButton } from '@/components/ui/view-button';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { flexRender, ColumnDef } from '@tanstack/react-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { DataTablePagination } from '@/components/ui/table/data-table-pagination';
import { useDataTable } from '@/hooks/use-data-table';

interface Feedback {
  id: string;
  subject: string;
  description: string;
  rating: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    phoneNumber: string;
  };
}

// Helper to render star graphics
const renderStars = (rating: number, size = 4) => {
  return (
    <div className='flex items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-${size} h-${size} ${
            s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
          }`}
        />
      ))}
    </div>
  );
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

// ─── Feedback Detail Drawer Component ──────────────────────────────────────────────
interface FeedbackDetailDrawerProps {
  feedback: Feedback | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function FeedbackDetailDrawer({
  feedback,
  isOpen,
  isLoading,
  onClose,
  onDelete
}: FeedbackDetailDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity'
        onClick={onClose}
      />
      <div className='bg-background animate-in slide-in-from-right fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-md flex-col overflow-hidden border-l shadow-2xl duration-300'>
        {/* Header */}
        <div className='bg-muted/30 flex items-center justify-between border-b px-6 py-5'>
          <div>
            <span className='text-[10px] font-black tracking-wider text-slate-400 uppercase'>
              Feedback Details
            </span>
            <h2 className='text-foreground mt-0.5 text-lg font-black'>
              Review Summary
            </h2>
          </div>
          <button
            onClick={onClose}
            className='bg-muted hover:bg-muted/80 text-muted-foreground rounded-full p-2 transition-colors focus:outline-none'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Body */}
        <div className='flex-1 space-y-6 overflow-y-auto p-6'>
          {!feedback ? (
            <div className='text-muted-foreground flex flex-col items-center justify-center space-y-3 py-20'>
              <Loader2 className='h-8 w-8 animate-spin text-red-500' />
              <p className='text-sm font-bold'>Loading...</p>
            </div>
          ) : (
            <>
              {/* Rating & Date */}
              <div className='flex items-center justify-between border-b pb-4'>
                <div className='space-y-1'>
                  <span className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'>
                    Rating Given
                  </span>
                  <div className='flex items-center gap-1'>
                    {renderStars(feedback.rating, 5)}
                  </div>
                </div>
                <div className='space-y-1 text-right'>
                  <span className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'>
                    Submitted On
                  </span>
                  <p className='flex items-center justify-end gap-1.5 text-xs font-bold text-slate-600'>
                    <Calendar className='h-3.5 w-3.5' />
                    {formatDate(feedback.createdAt)}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className='space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4'>
                <span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase'>
                  Customer Details
                </span>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-0.5'>
                    <span className='text-[10px] font-semibold text-slate-400'>
                      Name
                    </span>
                    <p className='flex items-center gap-1.5 text-sm font-bold text-slate-800'>
                      <User className='h-3.5 w-3.5 text-red-500' />
                      {feedback.user?.name || 'Anonymous'}
                    </p>
                  </div>
                  <div className='space-y-0.5'>
                    <span className='text-[10px] font-semibold text-slate-400'>
                      Phone
                    </span>
                    <p className='flex items-center gap-1.5 text-sm font-bold text-slate-800'>
                      <Phone className='h-3.5 w-3.5 text-slate-400' />
                      {feedback.user?.phoneNumber || 'N/A'}
                    </p>
                  </div>
                </div>
                {feedback.user?.email && (
                  <div className='border-t border-slate-100/50 pt-2'>
                    <span className='block text-[10px] font-semibold text-slate-400'>
                      Email Address
                    </span>
                    <p className='mt-0.5 text-xs font-bold text-slate-800'>
                      {feedback.user.email}
                    </p>
                  </div>
                )}
              </div>

              {/* Subject & Description */}
              <div className='space-y-3'>
                <span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase'>
                  Feedback Content
                </span>
                <div className='space-y-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm'>
                  <h4 className='text-sm font-extrabold text-slate-800'>
                    {feedback.subject}
                  </h4>
                  <p className='text-xs leading-relaxed font-semibold whitespace-pre-wrap text-slate-600'>
                    {feedback.description}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {feedback && (
          <div className='bg-muted/10 border-t px-6 py-5'>
            <Button
              onClick={() => onDelete(feedback.id)}
              disabled={isLoading}
              variant='outline'
              className='flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-rose-200 font-bold text-rose-600 hover:bg-rose-50'
            >
              {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Trash2 className='h-4 w-4' />
              )}
              Delete Feedback Entry
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FeedbackPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState({ totalItems: 0, averageRating: 0.0 });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  // nuqs Query States
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [ratingFilter] = useQueryState(
    'rating',
    parseAsString.withDefault('all')
  );
  const [searchQuery] = useQueryState('search', parseAsString.withDefault(''));

  const fetchFeedbacks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const ratingQuery =
        ratingFilter === 'all' ? '' : `&rating=${ratingFilter}`;
      const searchQueryParam = searchQuery
        ? `&search=${encodeURIComponent(searchQuery)}`
        : '';

      const res = await fetch(
        `${apiUrl}/admin/feedback?page=${page}&perPage=${perPage}${ratingQuery}${searchQueryParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        }
      );

      const data = await res.json();
      if (data.success && data.result) {
        setFeedbacks(data.result.feedbacks || []);
        setStats(data.result.stats || { totalItems: 0, averageRating: 0.0 });
      }
    } catch {
      toast.error('Failed to load feedbacks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFeedbacks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, perPage, ratingFilter, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this feedback entry?'))
      return;

    setDeletingId(id);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/admin/feedback/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Feedback entry deleted successfully.');
        setDrawerOpen(false);
        setSelectedFeedback(null);
        fetchFeedbacks();
      } else {
        toast.error(data.message || 'Failed to delete feedback.');
      }
    } catch {
      toast.error('Network error. Failed to delete feedback.');
    } finally {
      setDeletingId(null);
    }
  };

  const columns = React.useMemo<ColumnDef<Feedback>[]>(
    () => [
      {
        id: 'search',
        header: 'CUSTOMER',
        cell: ({ row }) => (
          <div>
            <p className='font-bold text-slate-800'>
              {row.original.user?.name || 'Anonymous'}
            </p>
            <p className='text-[11px] font-semibold text-slate-400'>
              {row.original.user?.phoneNumber || 'N/A'}
            </p>
          </div>
        ),
        meta: {
          label: 'Customer/Subject',
          placeholder: 'Search name, phone, subject...',
          variant: 'text'
        },
        enableColumnFilter: true
      },
      {
        id: 'rating',
        accessorKey: 'rating',
        header: 'RATING',
        cell: ({ row }) => renderStars(row.original.rating, 3.5),
        meta: {
          label: 'Rating',
          variant: 'select',
          options: [
            { label: '5 Stars', value: '5' },
            { label: '4 Stars', value: '4' },
            { label: '3 Stars', value: '3' },
            { label: '2 Stars', value: '2' },
            { label: '1 Star', value: '1' }
          ]
        },
        enableColumnFilter: true
      },
      {
        accessorKey: 'subject',
        header: 'SUBJECT',
        cell: ({ row }) => (
          <span className='line-clamp-1 max-w-[200px] font-semibold text-slate-800'>
            {row.original.subject}
          </span>
        )
      },
      {
        accessorKey: 'description',
        header: 'DESCRIPTION',
        cell: ({ row }) => (
          <span className='line-clamp-1 max-w-[300px] text-slate-500'>
            {row.original.description}
          </span>
        )
      },
      {
        accessorKey: 'createdAt',
        header: 'DATE SUBMITTED',
        cell: ({ row }) => (
          <span className='font-medium text-slate-500'>
            {formatDate(row.original.createdAt)}
          </span>
        )
      },
      {
        id: 'view',
        header: '',
        cell: ({ row }) => (
          <div className='flex justify-end'>
            <ViewButton
              onView={() => {
                setSelectedFeedback(row.original);
                setDrawerOpen(true);
              }}
            />
          </div>
        )
      }
    ],
    []
  );

  const pageCount = Math.ceil(stats.totalItems / perPage);

  const { table } = useDataTable({
    data: feedbacks,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    enableSorting: false
  });

  return (
    <PageContainer scrollable={true}>
      <div className='w-full space-y-6 pb-10'>
        {/* Header */}
        <div className='flex flex-col items-start justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center'>
          <div>
            <h1 className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
              <MessageSquare className='h-6 w-6 animate-pulse text-red-600' />
              Customer Feedbacks
            </h1>
            <p className='text-muted-foreground text-sm'>
              Manage and review client feedback ratings and suggestions
            </p>
          </div>
        </div>

        {/* Data Table View */}
        <div className='flex flex-1 flex-col space-y-4'>
          <DataTableToolbar table={table} />
          <div className='relative flex min-h-[400px] flex-1'>
            <div className='bg-card absolute inset-0 flex overflow-hidden rounded-lg border shadow-sm'>
              {loading ? (
                <div className='text-muted-foreground flex w-full flex-col items-center justify-center space-y-3 py-20'>
                  <Loader2 className='h-8 w-8 animate-spin text-red-500' />
                  <p className='text-sm font-semibold'>Loading feedbacks...</p>
                </div>
              ) : (
                <ScrollArea className='h-full w-full'>
                  <Table>
                    <TableHeader className='bg-muted sticky top-0 z-10'>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && 'selected'}
                            className='hover:bg-muted/50 cursor-pointer transition-colors'
                            onClick={() => {
                              setSelectedFeedback(row.original);
                              setDrawerOpen(true);
                            }}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className='h-24 text-center font-bold text-slate-400'
                          >
                            No feedback entries found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation='horizontal' />
                </ScrollArea>
              )}
            </div>
          </div>
          <DataTablePagination table={table} />
        </div>

        {/* Feedback Detail Drawer */}
        <FeedbackDetailDrawer
          feedback={selectedFeedback}
          isOpen={drawerOpen}
          isLoading={deletingId === selectedFeedback?.id}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedFeedback(null);
          }}
          onDelete={handleDelete}
        />
      </div>
    </PageContainer>
  );
}
